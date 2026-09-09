import { Injectable } from '@nestjs/common';
import { AccountStatus, ApprovalStatus, EmploymentStatus, Prisma, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { AssignRoleDto } from './dto/role-assignment.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LeaderAssignmentDto } from './dto/leader-assignment.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  GrantVaultPointsDto,
  BulkGrantVaultPointsDto,
  GrantProjectPackageDto,
  BulkGrantProjectPackageDto,
  GrantVaultType,
  WithdrawVaultPointsDto,
  AdminApproveWithdrawalDto,
  AccountantConfirmWithdrawalDto,
  RejectWithdrawalDto,
  WithdrawalQueryDto,
} from './dto/grant-vault-points.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtimeEvents: RealtimeEventsService,
    private readonly scope: DepartmentScopeService,
  ) {}

  assignRole(dto: AssignRoleDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const [user, role] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId } }),
        tx.role.findUnique({ where: { id: dto.roleId } }),
      ]);
      if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy user');
      if (!role) throw notFound('ROLE_NOT_FOUND', 'Không tìm thấy role');

      // BUG-08 FIX: Only Global Admin can assign the ADMIN role
      if (role.code === 'ADMIN' && !this.scope.isGlobalAdmin(actor)) {
        throw forbidden('FORBIDDEN_ROLE_ASSIGN', 'Chỉ Admin cấp cao nhất mới có quyền gán vai trò Quản trị viên');
      }

      // Region Admin: can only assign roles to users within their region
      if (this.scope.isRegionAdmin(actor)) {
        await this.scope.assertUserInScope(actor, dto.userId);
      }

      const existing = await tx.userRole.findFirst({
        where: {
          userId: dto.userId,
          roleId: dto.roleId,
          scopeType: dto.scopeType || RoleScopeType.GLOBAL,
          scopeId: dto.scopeId || null,
        },
      });

      let assignment;
      if (existing) {
        assignment = existing;
      } else {
        assignment = await tx.userRole.create({
          data: {
            userId: dto.userId,
            roleId: dto.roleId,
            scopeType: dto.scopeType || RoleScopeType.GLOBAL,
            scopeId: dto.scopeId || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.role.assign',
          entityType: 'UserRole',
          entityId: assignment.id,
          metadata: { roleId: dto.roleId, scopeType: dto.scopeType, scopeId: dto.scopeId },
        },
      });
      return assignment;
    });
  }

  async revokeRole(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const existingAssignment = await tx.userRole.findUnique({ where: { id }, include: { role: true } });
      if (!existingAssignment) throw notFound('ASSIGNMENT_NOT_FOUND', 'Không tìm thấy phân quyền này');

      // BUG-08 FIX: Only Global Admin can revoke the ADMIN role
      if (existingAssignment.role.code === 'ADMIN' && !this.scope.isGlobalAdmin(actor)) {
        throw forbidden('FORBIDDEN_ROLE_REVOKE', 'Chỉ Admin cấp cao nhất mới có quyền thu hồi vai trò Quản trị viên');
      }

      // Region Admin: can only revoke roles from users within their region
      if (this.scope.isRegionAdmin(actor)) {
        await this.scope.assertUserInScope(actor, existingAssignment.userId);
      }

      const assignment = await tx.userRole.delete({ where: { id } }).catch(() => null);
      if (!assignment) throw notFound('ASSIGNMENT_NOT_FOUND', 'Không tìm thấy phân quyền này');
      
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.role.revoke',
          entityType: 'UserRole',
          entityId: id,
          metadata: { userId: assignment.userId, roleId: assignment.roleId },
        },
      });
      return { revoked: true };
    });
  }

  async createUser(dto: CreateUserDto, actor: AuthenticatedUser) {
    // BUG-09 FIX: Region Admin can only create users in departments within their region
    if (dto.departmentId && this.scope.isRegionAdmin(actor)) {
      await this.scope.assertDepartmentAccessAsync(actor, dto.departmentId);
    }

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { OR: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])] },
      });
      if (existingUser) {
        throw badRequest('USER_EXISTS', 'Số điện thoại hoặc email đã được sử dụng');
      }

      const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
      const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
      const passwordHash = await bcrypt.hash(dto.password, 12);

      const user = await tx.user.create({
        data: {
          userCode,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          accountStatus: AccountStatus.ACTIVE,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
          profile: {
            create: {
              fullName: dto.fullName,
              idCardNumber: `TMP-${Date.now()}`,
              employmentStatus: EmploymentStatus.OFFICIAL,
              positionId: dto.positionId,
              joinDate: new Date(),
            },
          },
        },
      });

      if (dto.departmentId) {
        await tx.departmentMember.create({
          data: {
            departmentId: dto.departmentId,
            userId: user.id,
            isPrimary: true,
            positionId: dto.positionId,
          },
        });
      }

      const employeeRole = await tx.role.findUnique({ where: { code: 'EMPLOYEE' } });
      if (employeeRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: employeeRole.id,
            scopeType: RoleScopeType.GLOBAL,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.user.create',
          entityType: 'User',
          entityId: user.id,
        },
      });
      
      const { passwordHash: _hash, ...safeUser } = user;
      return safeUser;
    });
  }

  assignLeader(dto: LeaderAssignmentDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const [user, department, leaderRole, hrRole] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId } }),
        tx.department.findFirst({ where: { id: dto.departmentId, deletedAt: null, isActive: true } }),
        tx.role.findUnique({ where: { code: 'LEADER' } }),
        tx.role.findUnique({ where: { code: 'HR' } }),
      ]);
      if (!user || user.accountStatus !== AccountStatus.ACTIVE || !user.isActive) {
        throw badRequest('USER_NOT_ACTIVE', 'User chưa active');
      }
      if (!department) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
      if (!leaderRole) throw notFound('ROLE_NOT_FOUND', 'Không tìm thấy role LEADER');

      const isHrDept = 
        department.code?.toUpperCase() === 'HCNS' || 
        department.code?.toUpperCase() === 'HR' || 
        department.name?.toLowerCase().includes('nhân sự') || 
        department.name?.toLowerCase().includes('human resources');

      const assignment = await tx.userRole.upsert({
        where: {
          userId_roleId_scopeType_scopeId: {
            userId: dto.userId,
            roleId: leaderRole.id,
            scopeType: RoleScopeType.DEPARTMENT,
            scopeId: dto.departmentId,
          },
        },
        create: {
          userId: dto.userId,
          roleId: leaderRole.id,
          scopeType: RoleScopeType.DEPARTMENT,
          scopeId: dto.departmentId,
        },
        update: {},
      });

      // Tự động gán quyền HR cấp hệ thống nếu là Phòng Nhân sự
      if (isHrDept && hrRole) {
        const existingHrRole = await tx.userRole.findFirst({
          where: { userId: dto.userId, roleId: hrRole.id, scopeType: RoleScopeType.GLOBAL },
        });
        if (!existingHrRole) {
          await tx.userRole.create({
            data: { userId: dto.userId, roleId: hrRole.id, scopeType: RoleScopeType.GLOBAL },
          });
        }
      }

      if (dto.primary ?? true) {
        // Nếu có Trưởng phòng cũ khác với người mới, gỡ vai trò Leader & HR của Trưởng phòng cũ
        if (department.leaderUserId && department.leaderUserId !== dto.userId) {
          await tx.userRole.deleteMany({
            where: {
              userId: department.leaderUserId,
              roleId: leaderRole.id,
              scopeType: RoleScopeType.DEPARTMENT,
              scopeId: dto.departmentId,
            }
          });

          if (isHrDept && hrRole) {
            await tx.userRole.deleteMany({
              where: {
                userId: department.leaderUserId,
                roleId: hrRole.id,
                scopeType: RoleScopeType.GLOBAL,
              },
            });
          }
        }

        await tx.department.update({
          where: { id: dto.departmentId },
          data: { leaderUserId: dto.userId },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.leader.assign',
          entityType: 'UserRole',
          entityId: assignment.id,
          metadata: { departmentId: dto.departmentId, isHrDept },
        },
      });

      const bodyMsg = isHrDept
        ? `Bạn vừa được bổ nhiệm làm Trưởng phòng Nhân sự và tự động cấp quyền Quản trị HR toàn công ty.`
        : `Bạn vừa được bổ nhiệm làm quản lý chi nhánh/phòng ban ${department.name || ''}.`;

      const notif = await this.notifications.createForUsers(tx as any, [dto.userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Bổ nhiệm quản lý',
        body: bodyMsg,
      });
      if (notif) this.notifications.emitCreated(notif);

      this.realtimeEvents.emitToRoom('company', 'department:updated', { departmentId: dto.departmentId });

      return assignment;
    });
  }

  async revokeLeader(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.userRole.delete({ where: { id } });
      if (assignment.scopeId) {
        const dept = await tx.department.findUnique({ where: { id: assignment.scopeId } });
        const isHrDept = 
          dept?.code?.toUpperCase() === 'HCNS' || 
          dept?.code?.toUpperCase() === 'HR' || 
          dept?.name?.toLowerCase().includes('nhân sự');

        if (isHrDept) {
          const hrRole = await tx.role.findUnique({ where: { code: 'HR' } });
          if (hrRole) {
            await tx.userRole.deleteMany({
              where: { userId: assignment.userId, roleId: hrRole.id, scopeType: RoleScopeType.GLOBAL },
            });
          }
        }

        await tx.department.updateMany({
          where: { id: assignment.scopeId, leaderUserId: assignment.userId },
          data: { leaderUserId: null },
        });
      }
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.leader.revoke',
          entityType: 'UserRole',
          entityId: id,
          metadata: { userId: assignment.userId, departmentId: assignment.scopeId },
        },
      });

      if (assignment.scopeId) {
        const department = await tx.department.findUnique({ where: { id: assignment.scopeId } });
        const notif = await this.notifications.createForUsers(tx as any, [assignment.userId], {
          type: 'SYSTEM' as NotificationType,
          title: 'Thu hồi chức vụ',
          body: `Bạn đã được rút khỏi vai trò quản lý chi nhánh/phòng ban ${department?.name || ''}.`,
        });
        if (notif) this.notifications.emitCreated(notif);
        this.realtimeEvents.emitToRoom('company', 'department:updated', { departmentId: assignment.scopeId });
      }

      return { revoked: true };
    });
  }

  async findUsers(query: UserQueryDto, actor: AuthenticatedUser) {
    // BUG-01 FIX: Region Admin only sees users in departments within their region
    const visibleDepts = await this.scope.getVisibleDepartmentIds(actor);

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.accountStatus ? { accountStatus: query.accountStatus } : {}),
      ...(query.approvalStatus ? { approvalStatus: query.approvalStatus } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { phone: { contains: query.search, mode: 'insensitive' } },
              { userCode: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(query.role ? { roles: { some: { role: { code: query.role } } } } : {}),
      ...(query.departmentId
        ? { departmentLinks: { some: { departmentId: query.departmentId, leftAt: null } } }
        : visibleDepts !== null
        ? { departmentLinks: { some: { departmentId: { in: visibleDepts }, leftAt: null } } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          roles: { include: { role: true } },
          departmentLinks: { 
            where: { leftAt: null },
            include: { department: true, position: true } 
          },
          retentionVaults: {
            include: { milestones: { orderBy: { quarter: 'asc' } } },
            orderBy: { year: 'desc' },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map(({ passwordHash: _passwordHash, ...user }) => user),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findUser(id: string, actor: AuthenticatedUser) {
    // BUG-02 FIX: Region Admin can only view users within their region
    await this.scope.assertUserInScope(actor, id);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: { include: { role: true } },
        departmentLinks: { 
          where: { leftAt: null },
          include: { department: true, position: true } 
        },
        retentionVaults: {
          include: { milestones: { orderBy: { quarter: 'asc' } } },
          orderBy: { year: 'desc' },
        },
      },
    });
    if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy user');
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    // BUG-10 FIX: Region Admin can only update users within their region
    await this.scope.assertUserInScope(actor, id);

    // Region Admin: validate destination department is within their scope
    if (dto.departmentId && this.scope.isRegionAdmin(actor)) {
      await this.scope.assertDepartmentAccessAsync(actor, dto.departmentId);
    }

    if (dto.isRewardVaultEnabled !== undefined && !this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền bật/tắt Ví Thưởng Tết cho nhân viên');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          phone: dto.phone,
          email: dto.email,
          accountStatus: dto.accountStatus,
          isActive: dto.isActive,
          profile: dto.fullName || dto.positionId || dto.joinDate !== undefined
            ? {
                update: {
                  ...(dto.fullName ? { fullName: dto.fullName } : {}),
                  ...(dto.positionId !== undefined ? { positionId: dto.positionId } : {}),
                  ...(dto.joinDate !== undefined ? { joinDate: dto.joinDate ? new Date(dto.joinDate) : null } : {}),
                },
              }
            : undefined,
        },
        include: { profile: true },
      });

      if (dto.joinDate) {
        await tx.departmentMember.updateMany({
          where: { userId: id, leftAt: null },
          data: { joinedAt: new Date(dto.joinDate) },
        });
      }
      if (dto.departmentId) {
        // Clear previous active memberships from other departments
        const oldMemberships = await tx.departmentMember.findMany({
          where: { userId: id, leftAt: null, departmentId: { not: dto.departmentId } }
        });

        if (oldMemberships.length > 0) {
          const oldDepartmentIds = oldMemberships.map(m => m.departmentId);

          // Mark old memberships as left
          await tx.departmentMember.updateMany({
            where: { userId: id, leftAt: null, departmentId: { not: dto.departmentId } },
            data: { leftAt: new Date(), isPrimary: false },
          });

          // Revoke leader status in old departments if applicable
          const leaderRole = await tx.role.findUnique({ where: { code: 'LEADER' } });
          if (leaderRole) {
            await tx.userRole.deleteMany({
              where: { userId: id, roleId: leaderRole.id, scopeId: { in: oldDepartmentIds } },
            });
          }

          const oldDepts = await tx.department.findMany({ where: { id: { in: oldDepartmentIds } } });
          const wasHrLeader = oldDepts.some(dept => 
            dept.code?.toUpperCase() === 'HCNS' || 
            dept.code?.toUpperCase() === 'HR' || 
            dept.name?.toLowerCase().includes('nhân sự')
          );
          
          if (wasHrLeader) {
            const hrRole = await tx.role.findUnique({ where: { code: 'HR' } });
            if (hrRole) {
              await tx.userRole.deleteMany({
                where: { userId: id, roleId: hrRole.id, scopeType: RoleScopeType.GLOBAL },
              });
            }
          }

          // Nullify leaderUserId in the Department records
          await tx.department.updateMany({
            where: { id: { in: oldDepartmentIds }, leaderUserId: id },
            data: { leaderUserId: null },
          });

          // Emit real-time events for old departments
          for (const deptId of oldDepartmentIds) {
            this.realtimeEvents.emitToRoom('company', 'department:updated', { departmentId: deptId });
          }
        }

        await tx.departmentMember.upsert({
          where: { departmentId_userId: { departmentId: dto.departmentId, userId: id } },
          create: { departmentId: dto.departmentId, userId: id, positionId: dto.positionId, isPrimary: true },
          update: { leftAt: null, positionId: dto.positionId, isPrimary: true },
        });
      }

      // Giữ nguyên quyền khi tạm khóa hoặc vô hiệu hóa tài khoản

      const { passwordHash: _passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  async deleteUser(id: string, actor: AuthenticatedUser) {
    // BUG-11 FIX: Region Admin can only delete users within their region
    await this.scope.assertUserInScope(actor, id);

    const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) throw notFound('USER_NOT_FOUND', 'Người dùng không tồn tại');

    return this.prisma.$transaction(async (tx) => {
      const deletedSuffix = `_del_${Date.now()}`;

      const deletedUser = await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          accountStatus: AccountStatus.SUSPENDED,
          phone: `${user.phone}${deletedSuffix}`,
          userCode: `${user.userCode}${deletedSuffix}`,
          ...(user.email ? { email: `${user.email}${deletedSuffix}` } : {}),
        },
      });

      if (user.profile) {
        await tx.employeeProfile.update({
          where: { userId: id },
          data: {
            idCardNumber: `${user.profile.idCardNumber}${deletedSuffix}`,
          },
        });
      }

      await tx.departmentMember.updateMany({
        where: { userId: id, leftAt: null },
        data: { leftAt: new Date() },
      });

      const leaderRole = await tx.role.findUnique({ where: { code: 'LEADER' } });
      if (leaderRole) {
        await tx.userRole.deleteMany({
          where: { userId: id, roleId: leaderRole.id },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.user.delete',
          entityType: 'User',
          entityId: id,
        },
      });

      return { deleted: true, id };
    });
  }

  async grantVaultPoints(dto: GrantVaultPointsDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền trao điểm thưởng Ví Tết');
    }
    const year = dto.year || 2026;
    const cashValuePerPoint = dto.cashValuePerPoint || 1000;
    const points = dto.points;
    const grantType = dto.grantType || GrantVaultType.ANNUAL;
    const note = dto.note || (
      grantType === GrantVaultType.PROJECT_INSTANT
        ? 'Thưởng nóng dự án'
        : grantType === GrantVaultType.PROJECT_VESTING
        ? 'Thưởng dự án cộng dồn quý'
        : 'Cấp điểm Ví Tết đầu năm'
    );

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
        include: { profile: true },
      });
      if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy nhân viên');

      let vault = await tx.talentRetentionVault.findUnique({
        where: { userId_year: { userId: dto.userId, year } },
        include: { milestones: { orderBy: { quarter: 'asc' } } },
      });

      if (!vault) {
        vault = await tx.talentRetentionVault.create({
          data: {
            userId: dto.userId,
            year,
            grantedPoints: grantType === GrantVaultType.PROJECT_INSTANT ? 0 : points,
            instantBonusPoints: grantType === GrantVaultType.PROJECT_INSTANT ? points : 0,
            cashValuePerPoint,
            status: 'ACTIVE',
          },
          include: { milestones: { orderBy: { quarter: 'asc' } } },
        });
      }

      if (grantType === GrantVaultType.ANNUAL) {
        // Mode 1: ANNUAL VESTING (4 Quarters Evenly)
        vault = await tx.talentRetentionVault.update({
          where: { id: vault.id },
          data: {
            grantedPoints: points,
            cashValuePerPoint,
            status: 'ACTIVE',
          },
          include: { milestones: { orderBy: { quarter: 'asc' } } },
        });

        await tx.vestingMilestone.deleteMany({
          where: { vaultId: vault.id },
        });

        const qPoints = Math.floor(points / 4);
        const qRemainder = points - qPoints * 3;
        const qDates = [
          new Date(year, 2, 31),  // Q1: March 31
          new Date(year, 5, 30),  // Q2: June 30
          new Date(year, 8, 30),  // Q3: September 30
          new Date(year, 11, 31), // Q4: December 31
        ];

        for (let q = 1; q <= 4; q++) {
          const pts = q === 4 ? qRemainder : qPoints;
          const cash = pts * cashValuePerPoint;
          await tx.vestingMilestone.create({
            data: {
              vaultId: vault.id,
              quarter: q,
              unlockDate: qDates[q - 1],
              pointsToUnlock: pts,
              cashAmount: cash,
              isUnlocked: false,
              isWithdrawn: false,
            },
          });
        }

        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            userId: dto.userId,
            type: 'GRANT_ANNUAL',
            points,
            cashAmount: points * cashValuePerPoint,
            quarterTarget: 'ALL',
            note,
          },
        });
      } else if (grantType === GrantVaultType.PROJECT_INSTANT) {
        // Mode 2: INSTANT BONUS (Available immediately)
        vault = await tx.talentRetentionVault.update({
          where: { id: vault.id },
          data: {
            instantBonusPoints: { increment: points },
            cashValuePerPoint,
          },
          include: { milestones: { orderBy: { quarter: 'asc' } } },
        });

        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            userId: dto.userId,
            type: 'GRANT_PROJECT_INSTANT',
            points,
            cashAmount: points * cashValuePerPoint,
            quarterTarget: 'INSTANT',
            note,
          },
        });
      } else if (grantType === GrantVaultType.PROJECT_VESTING) {
        // Mode 3: PACED PROJECT VESTING (Divided evenly among remaining unwithdrawn quarters)
        let unwithdrawnMilestones = (vault.milestones || []).filter((m) => !m.isWithdrawn);

        if (unwithdrawnMilestones.length === 0) {
          // If no milestones exist yet, create 4 quarters
          const qDates = [
            new Date(year, 2, 31),
            new Date(year, 5, 30),
            new Date(year, 8, 30),
            new Date(year, 11, 31),
          ];
          for (let q = 1; q <= 4; q++) {
            await tx.vestingMilestone.create({
              data: {
                vaultId: vault.id,
                quarter: q,
                unlockDate: qDates[q - 1],
                pointsToUnlock: 0,
                cashAmount: 0,
                isUnlocked: false,
                isWithdrawn: false,
              },
            });
          }
          unwithdrawnMilestones = await tx.vestingMilestone.findMany({
            where: { vaultId: vault.id },
            orderBy: { quarter: 'asc' },
          });
        }

        const K = unwithdrawnMilestones.length;
        const ptsPerQ = Math.floor(points / K);
        const remainder = points - ptsPerQ * (K - 1);

        for (let i = 0; i < K; i++) {
          const m = unwithdrawnMilestones[i];
          const ptsToAdd = i === K - 1 ? remainder : ptsPerQ;
          const nextPts = m.pointsToUnlock + ptsToAdd;
          await tx.vestingMilestone.update({
            where: { id: m.id },
            data: {
              pointsToUnlock: nextPts,
              cashAmount: nextPts * cashValuePerPoint,
            },
          });
        }

        vault = await tx.talentRetentionVault.update({
          where: { id: vault.id },
          data: {
            grantedPoints: { increment: points },
            cashValuePerPoint,
          },
          include: { milestones: { orderBy: { quarter: 'asc' } } },
        });

        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            userId: dto.userId,
            type: 'GRANT_PROJECT_VESTING',
            points,
            cashAmount: points * cashValuePerPoint,
            quarterTarget: 'FUTURE_QUARTERS',
            note,
          },
        });
      }

      // Ensure isRewardVaultEnabled is set to true
      await tx.user.update({
        where: { id: dto.userId },
        data: { isRewardVaultEnabled: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.vault.grant_points',
          entityType: 'TalentRetentionVault',
          entityId: vault.id,
          metadata: {
            userId: dto.userId,
            userCode: user.userCode,
            points,
            year,
            grantType,
            note,
            totalCash: points * cashValuePerPoint,
          },
        },
      });

      // Send notification to user
      const totalCashFormatted = (points * cashValuePerPoint).toLocaleString('vi-VN');
      const title =
        grantType === GrantVaultType.PROJECT_INSTANT
          ? 'Thưởng nóng Dự án ⚡'
          : grantType === GrantVaultType.PROJECT_VESTING
          ? 'Thưởng dự án Tích lũy 📈'
          : 'Trao thưởng Đặc quyền Ví Tết 🧧';
      const body =
        grantType === GrantVaultType.PROJECT_INSTANT
          ? `Bạn vừa được thưởng nóng ${points.toLocaleString('vi-VN')} điểm (~${totalCashFormatted} VNĐ) từ "${note}". Số điểm này có thể rút ngay về ngân hàng!`
          : grantType === GrantVaultType.PROJECT_VESTING
          ? `Bạn vừa được thưởng dự án ${points.toLocaleString('vi-VN')} điểm (~${totalCashFormatted} VNĐ) từ "${note}", phân bổ đều vào các quý còn lại trong năm!`
          : `Ban Giám Đốc vừa trao tặng bạn ${points.toLocaleString('vi-VN')} điểm thưởng Ví Tết (~${totalCashFormatted} VNĐ)!`;

      const notif = await this.notifications.createForUsers(tx as any, [dto.userId], {
        type: 'SYSTEM' as NotificationType,
        title,
        body,
      });
      if (notif) this.notifications.emitCreated(notif);

      return tx.talentRetentionVault.findUnique({
        where: { id: vault.id },
        include: {
          milestones: { orderBy: { quarter: 'asc' } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
    });
  }

  async bulkGrantVaultPoints(dto: BulkGrantVaultPointsDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền trao điểm thưởng Ví Tết');
    }
    let targetUserIds: string[] = dto.userIds || [];

    if (dto.departmentId) {
      const members = await this.prisma.departmentMember.findMany({
        where: { departmentId: dto.departmentId, leftAt: null },
        select: { userId: true },
      });
      targetUserIds = members.map((m) => m.userId);
    }

    if (targetUserIds.length === 0) {
      throw badRequest('NO_USERS_FOUND', 'Không tìm thấy nhân sự phù hợp để trao điểm');
    }

    return {
      success: true,
      totalGrantedUsers: targetUserIds.length,
      pointsPerUser: dto.points,
      grantType: dto.grantType || 'ANNUAL',
    };
  }

  async grantProjectPackage(dto: GrantProjectPackageDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền trao gói thưởng Ví Tết');
    }
    const year = dto.year || new Date().getFullYear();
    const cashValuePerPoint = dto.cashValuePerPoint || 1000;
    const points = dto.points;
    const durationMonths = dto.durationMonths && dto.durationMonths > 0 ? dto.durationMonths : 12;
    const intervalMonths = dto.intervalMonths && dto.intervalMonths > 0 ? dto.intervalMonths : 3;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const title = dto.title.trim();
    const note = dto.note || `Trao gói thưởng: ${title}`;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
        include: { profile: true },
      });
      if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy nhân viên');

      let vault = await tx.talentRetentionVault.findUnique({
        where: { userId_year: { userId: dto.userId, year } },
      });

      if (!vault) {
        vault = await tx.talentRetentionVault.create({
          data: {
            userId: dto.userId,
            year,
            grantedPoints: points,
            instantBonusPoints: 0,
            cashValuePerPoint,
            status: 'ACTIVE',
          },
        });
      } else {
        vault = await tx.talentRetentionVault.update({
          where: { id: vault.id },
          data: {
            grantedPoints: { increment: points },
            cashValuePerPoint,
            status: 'ACTIVE',
          },
        });
      }

      // Create ProjectGrantPackage
      const pkg = await tx.projectGrantPackage.create({
        data: {
          vaultId: vault.id,
          userId: dto.userId,
          title,
          totalPoints: points,
          cashValuePerPoint,
          startDate,
          durationMonths,
          intervalMonths,
          status: 'ACTIVE',
          note: dto.note,
        },
      });

      // Calculate milestones
      const N = Math.max(1, Math.floor(durationMonths / intervalMonths));
      const pointsPerMilestone = Math.floor(points / N);
      const now = new Date();

      for (let i = 1; i <= N; i++) {
        const pts = i === N ? points - pointsPerMilestone * (N - 1) : pointsPerMilestone;
        const milestoneUnlockDate = new Date(startDate);
        milestoneUnlockDate.setMonth(milestoneUnlockDate.getMonth() + i * intervalMonths);
        const isUnlocked = milestoneUnlockDate <= now;

        await tx.grantMilestone.create({
          data: {
            packageId: pkg.id,
            milestoneIndex: i,
            title: `Đợt ${i} (Sau ${i * intervalMonths} tháng)`,
            unlockDate: milestoneUnlockDate,
            pointsToUnlock: pts,
            cashAmount: pts * cashValuePerPoint,
            withdrawnPoints: 0,
            isUnlocked,
            isWithdrawn: false,
          },
        });
      }

      // Record transaction
      await tx.vaultTransaction.create({
        data: {
          vaultId: vault.id,
          userId: dto.userId,
          type: 'GRANT_PROJECT_VESTING',
          points,
          cashAmount: points * cashValuePerPoint,
          quarterTarget: `${title} (${N} đợt)`,
          note,
        },
      });

      // Enable Vault
      await tx.user.update({
        where: { id: dto.userId },
        data: { isRewardVaultEnabled: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.vault.grant_package',
          entityType: 'ProjectGrantPackage',
          entityId: pkg.id,
          metadata: {
            userId: dto.userId,
            userCode: user.userCode,
            title,
            points,
            year,
            durationMonths,
            intervalMonths,
            startDate: startDate.toISOString(),
            milestonesCount: N,
          },
        },
      });

      // Send Notification
      const totalCashFormatted = (points * cashValuePerPoint).toLocaleString('vi-VN');
      const notif = await this.notifications.createForUsers(tx as any, [dto.userId], {
        type: 'SYSTEM' as NotificationType,
        title: `Trao gói thưởng: ${title} 🎁`,
        body: `Bạn vừa được trao gói thưởng "${title}" với ${points.toLocaleString('vi-VN')} điểm (~${totalCashFormatted} VNĐ), chia thành ${N} đợt rút trong ${durationMonths} tháng!`,
      });
      if (notif) this.notifications.emitCreated(notif);

      return tx.talentRetentionVault.findUnique({
        where: { id: vault.id },
        include: {
          packages: {
            include: { milestones: { orderBy: { milestoneIndex: 'asc' } } },
            orderBy: { createdAt: 'desc' },
          },
          milestones: { orderBy: { quarter: 'asc' } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
    });
  }

  async bulkGrantProjectPackage(dto: BulkGrantProjectPackageDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền trao gói thưởng Ví Tết');
    }
    let targetUserIds: string[] = dto.userIds || [];

    if (dto.departmentId) {
      const members = await this.prisma.departmentMember.findMany({
        where: { departmentId: dto.departmentId, leftAt: null },
        select: { userId: true },
      });
      targetUserIds = members.map((m) => m.userId);
    }

    if (targetUserIds.length === 0) {
      throw badRequest('NO_USERS_FOUND', 'Không tìm thấy nhân sự phù hợp để trao gói thưởng');
    }

    const results = [];
    for (const uId of targetUserIds) {
      const res = await this.grantProjectPackage(
        {
          userId: uId,
          title: dto.title,
          points: dto.points,
          year: dto.year,
          cashValuePerPoint: dto.cashValuePerPoint,
          startDate: dto.startDate,
          durationMonths: dto.durationMonths,
          intervalMonths: dto.intervalMonths,
          note: dto.note,
        },
        actor,
      );
      results.push(res);
    }

    return {
      success: true,
      totalGrantedUsers: results.length,
      pointsPerUser: dto.points,
      title: dto.title,
    };
  }

  async withdrawVaultPoints(dto: WithdrawVaultPointsDto, userId: string) {
    const currentYear = new Date().getFullYear();
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy người dùng');
      if (!user.isRewardVaultEnabled) {
        throw badRequest('VAULT_DISABLED', 'Tính năng Ví Tết chưa được kích hoạt cho tài khoản này');
      }

      const vault = await tx.talentRetentionVault.findFirst({
        where: { userId, year: currentYear },
        include: {
          packages: {
            where: { status: 'ACTIVE' },
            orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
            include: {
              milestones: { orderBy: { milestoneIndex: 'asc' } },
            },
          },
          milestones: { orderBy: { quarter: 'asc' } },
        },
      });
      if (!vault) throw notFound('VAULT_NOT_FOUND', 'Chưa tìm thấy ví thưởng của năm hiện tại');

      const instantBonusPoints = vault.instantBonusPoints || 0;
      const cashValuePerPoint = Number(vault.cashValuePerPoint || 1000);
      const now = new Date();

      // Calculate total available points across packages and legacy milestones based on milestone policy:
      // - If reachedCount === 0 (Chưa đến đợt 1): Không được rút từ gói (max = 0)
      // - If reachedCount === 1 (Đang ở đợt 1): Chỉ được rút tối đa phần chưa rút của đợt 1
      // - If reachedCount >= 2 && reachedCount < milestones.length (Từ đợt 2 trở đi): Được rút nhiều hơn (bao gồm ứng trước), nhưng BẢO LƯU mốc cuối cùng (Đợt 4/Tết)
      // - If reachedCount === milestones.length (Đã đến đợt cuối): Được tất toán 100%
      let packageAvailablePoints = 0;
      for (const pkg of vault.packages || []) {
        const milestones = pkg.milestones || [];
        if (milestones.length === 0) continue;
        const reachedMilestones = milestones.filter((m: any) => new Date(m.unlockDate) <= now);
        const reachedCount = reachedMilestones.length;

        if (reachedCount === 0) {
          // Chưa đến hạn đợt 1
          continue;
        } else if (reachedCount === 1) {
          // Đang ở đợt 1: chỉ rút số điểm còn lại của đợt 1
          const m1 = milestones[0];
          packageAvailablePoints += Math.max(0, (m1.pointsToUnlock || 0) - (m1.withdrawnPoints || 0));
        } else if (reachedCount >= 2 && reachedCount < milestones.length) {
          // Từ đợt 2: cho phép rút vượt đợt 2 và ứng trước, NHƯNG giữ lại đợt cuối cùng
          for (let i = 0; i < milestones.length - 1; i++) {
            const m = milestones[i];
            packageAvailablePoints += Math.max(0, (m.pointsToUnlock || 0) - (m.withdrawnPoints || 0));
          }
        } else {
          // Đã đến hạn đợt cuối: tất toán 100%
          for (const m of milestones) {
            packageAvailablePoints += Math.max(0, (m.pointsToUnlock || 0) - (m.withdrawnPoints || 0));
          }
        }
      }

      let legacyMilestonePoints = 0;
      const legacyMilestones = vault.milestones || [];
      if (legacyMilestones.length > 0) {
        const reachedLegacy = legacyMilestones.filter((m: any) => new Date(m.unlockDate) <= now && m.pointsToUnlock > 0);
        const reachedLegacyCount = reachedLegacy.length;

        if (reachedLegacyCount === 1) {
          const q1 = legacyMilestones.find((m: any) => m.quarter === 1 && !m.isWithdrawn);
          legacyMilestonePoints += q1 ? q1.pointsToUnlock : 0;
        } else if (reachedLegacyCount >= 2 && reachedLegacyCount < legacyMilestones.length) {
          legacyMilestonePoints += legacyMilestones
            .filter((m: any) => m.quarter < 4 && !m.isWithdrawn)
            .reduce((s: number, m: any) => s + (m.pointsToUnlock || 0), 0);
        } else if (reachedLegacyCount >= legacyMilestones.length) {
          legacyMilestonePoints += legacyMilestones
            .filter((m: any) => !m.isWithdrawn)
            .reduce((s: number, m: any) => s + (m.pointsToUnlock || 0), 0);
        }
      }

      const maxWithdrawable = instantBonusPoints + packageAvailablePoints + legacyMilestonePoints;

      if (maxWithdrawable <= 0) {
        throw badRequest(
          'VAULT_NOT_YET_DUE',
          'Chưa đến thời hạn mở khóa rút tiền của đợt thưởng đầu tiên.',
        );
      }

      if (dto.points > maxWithdrawable) {
        throw badRequest(
          'EXCEEDS_MAX_WITHDRAWABLE',
          `Số điểm yêu cầu rút (${dto.points.toLocaleString('vi-VN')} điểm) vượt quá hạn mức tối đa cho phép của đợt này (${maxWithdrawable.toLocaleString('vi-VN')} điểm). Lưu ý: Ở Đợt 1 chỉ được rút hạn mức Đợt 1; Từ Đợt 2 được rút linh hoạt nhưng phải bảo lưu mốc cuối cùng để tất toán cuối niên độ.`,
        );
      }

      let remainingToDeduct = dto.points;
      let deductedInstant = 0;

      // 1. Deduct from Instant Bonus Points
      if (remainingToDeduct > 0 && instantBonusPoints > 0) {
        deductedInstant = Math.min(remainingToDeduct, instantBonusPoints);
        remainingToDeduct -= deductedInstant;
        await tx.talentRetentionVault.update({
          where: { id: vault.id },
          data: { instantBonusPoints: instantBonusPoints - deductedInstant },
        });
        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            userId,
            type: 'WITHDRAW_REGULAR',
            points: -deductedInstant,
            cashAmount: deductedInstant * cashValuePerPoint,
            quarterTarget: 'INSTANT',
            note: dto.note || 'Rút điểm thưởng nóng dự án',
          },
        });
      }

      // 2. Sequential FIFO Deduction: Unlocked Milestones in Packages (unlockDate <= now)
      // Packages are already sorted by startDate ASC, createdAt ASC
      if (remainingToDeduct > 0) {
        for (const pkg of vault.packages || []) {
          if (remainingToDeduct <= 0) break;
          const unlockedMilestones = (pkg.milestones || []).filter(
            (m) => !m.isWithdrawn && (m.pointsToUnlock - m.withdrawnPoints > 0) && new Date(m.unlockDate) <= now,
          );
          for (const m of unlockedMilestones) {
            if (remainingToDeduct <= 0) break;
            const availableInMilestone = m.pointsToUnlock - m.withdrawnPoints;
            const pts = Math.min(remainingToDeduct, availableInMilestone);
            remainingToDeduct -= pts;
            const newWithdrawn = m.withdrawnPoints + pts;
            const isFullyWithdrawn = newWithdrawn >= m.pointsToUnlock;

            await tx.grantMilestone.update({
              where: { id: m.id },
              data: {
                withdrawnPoints: newWithdrawn,
                isWithdrawn: isFullyWithdrawn,
                isUnlocked: true,
                withdrawnAt: isFullyWithdrawn ? new Date() : m.withdrawnAt,
              },
            });

            await tx.vaultTransaction.create({
              data: {
                vaultId: vault.id,
                userId,
                type: 'WITHDRAW_REGULAR',
                points: -pts,
                cashAmount: pts * cashValuePerPoint,
                quarterTarget: `${pkg.title} - ${m.title}`,
                note: dto.note || `Rút hạn mức ${pkg.title} (${m.title})`,
              },
            });
          }
        }
      }

      // 2.1 Deduct from unlocked legacy milestones if any
      if (remainingToDeduct > 0) {
        const unlockedLegacy = (vault.milestones || []).filter(
          (m) => !m.isWithdrawn && m.pointsToUnlock > 0 && new Date(m.unlockDate) <= now,
        );
        for (const m of unlockedLegacy) {
          if (remainingToDeduct <= 0) break;
          const pts = Math.min(remainingToDeduct, m.pointsToUnlock);
          remainingToDeduct -= pts;
          const nextPts = m.pointsToUnlock - pts;
          await tx.vestingMilestone.update({
            where: { id: m.id },
            data: {
              pointsToUnlock: nextPts,
              cashAmount: nextPts * cashValuePerPoint,
              isWithdrawn: nextPts === 0,
              withdrawnAt: nextPts === 0 ? new Date() : undefined,
            },
          });
          await tx.vaultTransaction.create({
            data: {
              vaultId: vault.id,
              userId,
              type: 'WITHDRAW_REGULAR',
              points: -pts,
              cashAmount: pts * cashValuePerPoint,
              quarterTarget: `Q${m.quarter}`,
              note: dto.note || `Rút hạn mức Quý ${m.quarter}`,
            },
          });
        }
      }

      // 3. Advance Withdrawal from future locked milestones (Reverse Waterfall: last milestone to first)
      if (remainingToDeduct > 0) {
        for (const pkg of [...(vault.packages || [])].reverse()) {
          if (remainingToDeduct <= 0) break;
          const futureMilestones = (pkg.milestones || [])
            .filter((m) => !m.isWithdrawn && (m.pointsToUnlock - m.withdrawnPoints > 0) && new Date(m.unlockDate) > now)
            .sort((a, b) => b.milestoneIndex - a.milestoneIndex);

          for (const m of futureMilestones) {
            if (remainingToDeduct <= 0) break;
            const availableInMilestone = m.pointsToUnlock - m.withdrawnPoints;
            const pts = Math.min(remainingToDeduct, availableInMilestone);
            remainingToDeduct -= pts;
            const newWithdrawn = m.withdrawnPoints + pts;
            const isFullyWithdrawn = newWithdrawn >= m.pointsToUnlock;

            await tx.grantMilestone.update({
              where: { id: m.id },
              data: {
                withdrawnPoints: newWithdrawn,
                isWithdrawn: isFullyWithdrawn,
                withdrawnAt: isFullyWithdrawn ? new Date() : m.withdrawnAt,
              },
            });

            await tx.vaultTransaction.create({
              data: {
                vaultId: vault.id,
                userId,
                type: 'WITHDRAW_ADVANCE',
                points: -pts,
                cashAmount: pts * cashValuePerPoint,
                quarterTarget: `${pkg.title} - ${m.title}`,
                note: `Rút ứng trước từ ${pkg.title} (${m.title})${dto.note ? ': ' + dto.note : ''}`,
              },
            });
          }
        }
      }

      // 3.1 Advance withdrawal from legacy future milestones if still needed
      if (remainingToDeduct > 0) {
        const futureMilestones = (vault.milestones || [])
          .filter((m) => !m.isWithdrawn && m.pointsToUnlock > 0 && new Date(m.unlockDate) > now)
          .sort((a, b) => b.quarter - a.quarter);

        for (const m of futureMilestones) {
          if (remainingToDeduct <= 0) break;
          const pts = Math.min(remainingToDeduct, m.pointsToUnlock);
          remainingToDeduct -= pts;
          const nextPts = m.pointsToUnlock - pts;
          await tx.vestingMilestone.update({
            where: { id: m.id },
            data: {
              pointsToUnlock: nextPts,
              cashAmount: nextPts * cashValuePerPoint,
              isWithdrawn: nextPts === 0,
              withdrawnAt: nextPts === 0 ? new Date() : undefined,
            },
          });
          await tx.vaultTransaction.create({
            data: {
              vaultId: vault.id,
              userId,
              type: 'WITHDRAW_ADVANCE',
              points: -pts,
              cashAmount: pts * cashValuePerPoint,
              quarterTarget: `Q${m.quarter}`,
              note: `Rút ứng trước từ Quý ${m.quarter}${dto.note ? ': ' + dto.note : ''}`,
            },
          });
        }
      }

      // 4. Create Withdrawal Request
      const totalCash = dto.points * cashValuePerPoint;
      const employeeName = user.profile?.fullName || user.userCode;
      const request = await tx.rewardWithdrawalRequest.create({
        data: {
          userId,
          pointsWithdrawn: dto.points,
          cashAmount: totalCash,
          bankName: dto.bankName || 'Quy đổi ngoài (Nội bộ)',
          bankAccountNumber: dto.bankAccountNumber || 'N/A',
          bankAccountName: (dto.bankAccountName || employeeName).toUpperCase(),
          note: dto.note || undefined,
          status: 'PENDING_ADMIN',
        },
      });

      // 5. Send Notifications
      // 5.1 Notify Admins
      let regionId: string | null = null;
      const member = await tx.departmentMember.findFirst({
        where: { userId: user.id, leftAt: null },
        select: { department: { select: { branch: { select: { regionId: true } } } } }
      });
      if (member?.department?.branch?.regionId) {
        regionId = member.department.branch.regionId;
      }

      const adminUsers = await tx.userRole.findMany({
        where: { role: { code: 'ADMIN' }, user: { accountStatus: 'ACTIVE', isActive: true, deletedAt: null } },
        select: { userId: true, scopeType: true, scopeId: true },
      });
      const adminIdsSet = new Set<string>();
      adminUsers.forEach(ur => {
        if (ur.scopeType === 'GLOBAL' || !ur.scopeType) {
          adminIdsSet.add(ur.userId);
        } else if (ur.scopeType === 'REGION' && ur.scopeId === regionId) {
          adminIdsSet.add(ur.userId);
        }
      });
      const adminIds = Array.from(adminIdsSet);

      if (adminIds.length > 0) {
        const adminNotif = await this.notifications.createForUsers(tx as any, adminIds, {
          type: 'SYSTEM' as NotificationType,
          title: 'Yêu cầu rút Ví Thưởng mới ⏳',
          body: `Nhân viên ${employeeName} vừa gửi yêu cầu rút ${dto.points.toLocaleString('vi-VN')} điểm (~${totalCash.toLocaleString('vi-VN')} VNĐ)${dto.note ? ` (Ghi chú: ${dto.note})` : ''}. Vui lòng phê duyệt.`,
        });
        if (adminNotif) this.notifications.emitCreated(adminNotif);
      }

      // 5.2 Notify Employee
      const notif = await this.notifications.createForUsers(tx as any, [userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Yêu cầu rút điểm Ví Tết đã được gửi 💸',
        body: `Bạn đã gửi yêu cầu rút ${dto.points.toLocaleString('vi-VN')} điểm (~${totalCash.toLocaleString('vi-VN')} VNĐ) về tài khoản ${dto.bankName}. Yêu cầu đang được chuyển đến Ban Giám Đốc để phê duyệt.`,
      });
      if (notif) this.notifications.emitCreated(notif);

      return {
        success: true,
        requestId: request.id,
        pointsWithdrawn: dto.points,
        cashAmount: totalCash,
        remainingInstantPoints: instantBonusPoints - deductedInstant,
        vault: await tx.talentRetentionVault.findUnique({
          where: { id: vault.id },
          include: {
            packages: {
              include: { milestones: { orderBy: { milestoneIndex: 'asc' } } },
            },
            milestones: { orderBy: { quarter: 'asc' } },
            transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        }),
      };
    });
  }

  async getVaultWithdrawalRequests(query: WithdrawalQueryDto, actor?: AuthenticatedUser) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    let scopeFilter: Prisma.RewardWithdrawalRequestWhereInput = {};
    if (actor) {
      const visibleDepts = await this.scope.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null) {
        scopeFilter = {
          user: {
            departmentLinks: {
              some: {
                leftAt: null,
                departmentId: { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] },
              },
            },
          },
        };
      }
    }

    const where: Prisma.RewardWithdrawalRequestWhereInput = {
      ...scopeFilter,
    };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { bankAccountName: { contains: query.search, mode: 'insensitive' } },
        { bankAccountNumber: { contains: query.search, mode: 'insensitive' } },
        { bankName: { contains: query.search, mode: 'insensitive' } },
        { user: { userCode: { contains: query.search, mode: 'insensitive' } } },
        { user: { profile: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total, pendingAdminCount, pendingAccountantCount, paidCount, rejectedCount] = await Promise.all([
      this.prisma.rewardWithdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              email: true,
              phone: true,
              profile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                  position: true,
                },
              },
              departmentLinks: {
                where: { leftAt: null, isPrimary: true },
                include: { department: true, position: true },
              },
            },
          },
        },
      }),
      this.prisma.rewardWithdrawalRequest.count({ where }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PENDING_ADMIN', ...scopeFilter } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PENDING_ACCOUNTANT', ...scopeFilter } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PAID', ...scopeFilter } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'REJECTED', ...scopeFilter } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        PENDING_ADMIN: pendingAdminCount,
        PENDING_ACCOUNTANT: pendingAccountantCount,
        PAID: paidCount,
        REJECTED: rejectedCount,
        TOTAL: pendingAdminCount + pendingAccountantCount + paidCount + rejectedCount,
      },
    };
  }

  async adminApproveWithdrawal(id: string, dto: AdminApproveWithdrawalDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor)) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin mới có quyền phê duyệt yêu cầu rút tiền Ví Tết');
    }
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rewardWithdrawalRequest.findUnique({
        where: { id },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      if (!request) throw notFound('REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu rút tiền');
      if (request.status !== 'PENDING_ADMIN') {
        throw badRequest('INVALID_STATUS', `Chỉ có thể phê duyệt yêu cầu ở trạng thái Chờ Admin duyệt (Hiện tại: ${request.status})`);
      }

      const updated = await tx.rewardWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'PENDING_ACCOUNTANT',
          adminApprovedBy: actor.userId,
          adminApprovedAt: new Date(),
          adminNote: dto.note || undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.vault.approve_withdrawal',
          entityType: 'RewardWithdrawalRequest',
          entityId: id,
          metadata: {
            requestId: id,
            userId: request.userId,
            points: request.pointsWithdrawn,
            cashAmount: request.cashAmount,
            note: dto.note,
          },
        },
      });

      // Notify Accountants & Admins
      const accountantUsers = await tx.userRole.findMany({
        where: { role: { code: { in: ['ACCOUNTANT', 'ADMIN'] } } },
        select: { userId: true },
      });
      const accountantIds = [...new Set(accountantUsers.map((u) => u.userId))];

      const empName = request.user.profile?.fullName || request.user.userCode;
      const cashFormatted = Number(request.cashAmount).toLocaleString('vi-VN');

      if (accountantIds.length > 0) {
        const notifAccountants = await this.notifications.createForUsers(tx as any, accountantIds, {
          type: 'SYSTEM' as NotificationType,
          title: 'Lệnh chi tiền Ví Thưởng 💼',
          body: `Admin đã phê duyệt yêu cầu rút tiền của ${empName} (~${cashFormatted} VNĐ). Vui lòng thực hiện chuyển khoản vào TK ${request.bankName} - ${request.bankAccountNumber} (${request.bankAccountName}) và xác nhận.`,
        });
        if (notifAccountants) this.notifications.emitCreated(notifAccountants);
      }

      // Notify Employee
      const notifEmployee = await this.notifications.createForUsers(tx as any, [request.userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Yêu cầu rút tiền đã được Ban Giám Đốc duyệt ✅',
        body: `Ban Giám Đốc đã phê duyệt yêu cầu rút ${cashFormatted} VNĐ của bạn. Yêu cầu đang được chuyển sang bộ phận Kế toán để thực hiện chi trả 💸.`,
      });
      if (notifEmployee) this.notifications.emitCreated(notifEmployee);

      return updated;
    });
  }

  async accountantConfirmWithdrawal(id: string, dto: AccountantConfirmWithdrawalDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rewardWithdrawalRequest.findUnique({
        where: { id },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      if (!request) throw notFound('REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu rút tiền');
      if (request.status !== 'PENDING_ACCOUNTANT') {
        throw badRequest('INVALID_STATUS', `Chỉ có thể xác nhận chi tiền cho yêu cầu ở trạng thái Chờ Kế toán chi tiền (Hiện tại: ${request.status})`);
      }

      const updated = await tx.rewardWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'PAID',
          accountantConfirmedBy: actor.userId,
          accountantConfirmedAt: new Date(),
          accountantNote: dto.note || undefined,
          transactionReference: dto.transactionReference || undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'accountant.vault.confirm_paid',
          entityType: 'RewardWithdrawalRequest',
          entityId: id,
          metadata: {
            requestId: id,
            userId: request.userId,
            points: request.pointsWithdrawn,
            cashAmount: request.cashAmount,
            transactionReference: dto.transactionReference,
            note: dto.note,
          },
        },
      });

      // Notify Employee
      const cashFormatted = Number(request.cashAmount).toLocaleString('vi-VN');
      const notifPaid = await this.notifications.createForUsers(tx as any, [request.userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Chuyển tiền thưởng thành công 🎉💸',
        body: `Bộ phận Kế toán đã hoàn tất chuyển ${cashFormatted} VNĐ về tài khoản ${request.bankName} (${request.bankAccountNumber} - ${request.bankAccountName})${dto.transactionReference ? ` [Mã GD: ${dto.transactionReference}]` : ''}. Vui lòng kiểm tra tài khoản ngân hàng!`,
      });
      if (notifPaid) this.notifications.emitCreated(notifPaid);

      return updated;
    });
  }

  async rejectWithdrawal(id: string, dto: RejectWithdrawalDto, actor: AuthenticatedUser) {
    if (!this.scope.isGlobalAdmin(actor) && !actor.roles?.includes('ACCOUNTANT')) {
      throw forbidden('FORBIDDEN_GLOBAL_ADMIN', 'Chỉ Super Admin hoặc Kế toán mới có quyền từ chối yêu cầu rút tiền');
    }
    const currentYear = new Date().getFullYear();
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rewardWithdrawalRequest.findUnique({
        where: { id },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      if (!request) throw notFound('REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu rút tiền');
      if (request.status === 'PAID' || request.status === 'REJECTED') {
        throw badRequest('INVALID_STATUS', `Không thể từ chối yêu cầu đã ở trạng thái ${request.status}`);
      }

      const updated = await tx.rewardWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedBy: actor.userId,
          rejectedAt: new Date(),
          rejectReason: dto.reason,
        },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      // Refund points to user's vault
      const vault = await tx.talentRetentionVault.findFirst({
        where: { userId: request.userId, year: currentYear },
        include: { milestones: { orderBy: { quarter: 'asc' } } },
      });

      if (vault) {
        const cashValuePerPoint = Number(vault.cashValuePerPoint || 1000);
        let pointsToRefund = request.pointsWithdrawn;

        // Refund to milestones in forward quarter order Q1 -> Q2 -> Q3 -> Q4
        const milestones = vault.milestones || [];
        const quarterAlloc = Math.floor(vault.grantedPoints / 4);

        for (const m of milestones) {
          if (pointsToRefund <= 0) break;
          const targetPoints = m.quarter === 4 ? vault.grantedPoints - quarterAlloc * 3 : quarterAlloc;
          const currentPoints = m.pointsToUnlock;
          const shortfall = Math.max(0, targetPoints - currentPoints);

          if (shortfall > 0) {
            const addPts = Math.min(pointsToRefund, shortfall);
            pointsToRefund -= addPts;
            const newPts = currentPoints + addPts;
            await tx.vestingMilestone.update({
              where: { id: m.id },
              data: {
                pointsToUnlock: newPts,
                cashAmount: newPts * cashValuePerPoint,
                isWithdrawn: false,
                withdrawnAt: null,
              },
            });
          }
        }

        // If any points remaining to refund, add to instantBonusPoints
        if (pointsToRefund > 0) {
          await tx.talentRetentionVault.update({
            where: { id: vault.id },
            data: {
              instantBonusPoints: (vault.instantBonusPoints || 0) + pointsToRefund,
            },
          });
        }

        // Create Refund Transaction
        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            userId: request.userId,
            type: 'REFUND_WITHDRAWAL',
            points: request.pointsWithdrawn,
            cashAmount: request.cashAmount,
            note: `Hoàn trả yêu cầu rút tiền bị từ chối: ${dto.reason}`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'admin.vault.reject_withdrawal',
          entityType: 'RewardWithdrawalRequest',
          entityId: id,
          metadata: {
            requestId: id,
            userId: request.userId,
            points: request.pointsWithdrawn,
            cashAmount: request.cashAmount,
            reason: dto.reason,
          },
        },
      });

      // Notify Employee
      const cashFormatted = Number(request.cashAmount).toLocaleString('vi-VN');
      const notifReject = await this.notifications.createForUsers(tx as any, [request.userId], {
        type: 'SYSTEM' as NotificationType,
        title: 'Yêu cầu rút tiền bị từ chối ❌',
        body: `Yêu cầu rút ${cashFormatted} VNĐ của bạn đã bị từ chối. Lý do: "${dto.reason}". Số điểm tương ứng (${request.pointsWithdrawn.toLocaleString('vi-VN')} điểm) đã được hoàn trả lại vào ví của bạn.`,
      });
      if (notifReject) this.notifications.emitCreated(notifReject);

      return updated;
    });
  }

  async getMyVault(userId: string) {
    const currentYear = new Date().getFullYear();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userCode: true, isRewardVaultEnabled: true },
    });
    if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy người dùng');

    const [vault, withdrawalRequests] = await Promise.all([
      this.prisma.talentRetentionVault.findFirst({
        where: { userId, year: currentYear },
        include: {
          packages: {
            orderBy: { createdAt: 'desc' },
            include: {
              milestones: {
                orderBy: { milestoneIndex: 'asc' },
              },
            },
          },
          milestones: { orderBy: { quarter: 'asc' } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      }),
      this.prisma.rewardWithdrawalRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    if (!vault) {
      return {
        isVaultEnabled: Boolean(user.isRewardVaultEnabled),
        vault: null,
        withdrawalRequests: withdrawalRequests || [],
        stats: {
          totalGrantedPoints: 0,
          instantBonusPoints: 0,
          unlockedQuarterPoints: 0,
          lockedQuarterPoints: 0,
          unlockedPoints: 0,
          maxWithdrawable: 0,
          cashValuePerPoint: 1000,
        },
      };
    }

    const now = new Date();
    const instantBonusPoints = vault.instantBonusPoints || 0;
    const cashValuePerPoint = Number(vault.cashValuePerPoint || 1000);

    let unlockedQuarterPoints = 0;
    let lockedQuarterPoints = 0;
    let totalPackagePoints = 0;

    // Tally package milestones
    (vault.packages || []).forEach((pkg) => {
      totalPackagePoints += pkg.totalPoints;
      (pkg.milestones || []).forEach((m) => {
        const remaining = Math.max(0, m.pointsToUnlock - m.withdrawnPoints);
        if (remaining > 0) {
          if (new Date(m.unlockDate) <= now) {
            unlockedQuarterPoints += remaining;
          } else {
            lockedQuarterPoints += remaining;
          }
        }
      });
    });

    // Tally legacy milestones if any
    (vault.milestones || []).forEach((m) => {
      if (!m.isWithdrawn && m.pointsToUnlock > 0) {
        if (new Date(m.unlockDate) <= now) {
          unlockedQuarterPoints += m.pointsToUnlock;
        } else {
          lockedQuarterPoints += m.pointsToUnlock;
        }
      }
    });

    const totalGrantedPoints = totalPackagePoints > 0 ? totalPackagePoints : vault.grantedPoints;
    const unlockedPoints = instantBonusPoints + unlockedQuarterPoints;

    // Calculate maxWithdrawable based on milestone policy:
    let totalPackageWithdrawable = 0;
    (vault.packages || []).forEach((pkg) => {
      const milestones = pkg.milestones || [];
      if (milestones.length === 0) return;
      const reachedMilestones = milestones.filter((m: any) => new Date(m.unlockDate) <= now);
      const reachedCount = reachedMilestones.length;

      if (reachedCount === 0) {
        // Chưa đến hạn đợt 1 -> chưa được rút từ gói
        return;
      } else if (reachedCount === 1) {
        // Đang ở đợt 1 -> chỉ rút số điểm còn lại của đợt 1
        const m1 = milestones[0];
        totalPackageWithdrawable += Math.max(0, (m1.pointsToUnlock || 0) - (m1.withdrawnPoints || 0));
      } else if (reachedCount >= 2 && reachedCount < milestones.length) {
        // Từ đợt 2 -> được rút linh hoạt nhưng bảo lưu mốc cuối cùng
        for (let i = 0; i < milestones.length - 1; i++) {
          const m = milestones[i];
          totalPackageWithdrawable += Math.max(0, (m.pointsToUnlock || 0) - (m.withdrawnPoints || 0));
        }
      } else {
        // Đã đến hạn đợt cuối -> được tất toán 100%
        for (const m of milestones) {
          totalPackageWithdrawable += Math.max(0, (m.pointsToUnlock || 0) - (m.withdrawnPoints || 0));
        }
      }
    });

    let legacyWithdrawable = 0;
    const legacyMilestones = vault.milestones || [];
    if (legacyMilestones.length > 0) {
      const reachedLegacy = legacyMilestones.filter((m: any) => new Date(m.unlockDate) <= now && m.pointsToUnlock > 0);
      const reachedLegacyCount = reachedLegacy.length;

      if (reachedLegacyCount === 1) {
        const q1 = legacyMilestones.find((m: any) => m.quarter === 1 && !m.isWithdrawn);
        legacyWithdrawable += q1 ? q1.pointsToUnlock : 0;
      } else if (reachedLegacyCount >= 2 && reachedLegacyCount < legacyMilestones.length) {
        legacyWithdrawable += legacyMilestones
          .filter((m: any) => m.quarter < 4 && !m.isWithdrawn)
          .reduce((s: number, m: any) => s + (m.pointsToUnlock || 0), 0);
      } else if (reachedLegacyCount >= legacyMilestones.length) {
        legacyWithdrawable += legacyMilestones
          .filter((m: any) => !m.isWithdrawn)
          .reduce((s: number, m: any) => s + (m.pointsToUnlock || 0), 0);
      }
    }

    const maxWithdrawable = instantBonusPoints + totalPackageWithdrawable + legacyWithdrawable;

    return {
      isVaultEnabled: Boolean(user.isRewardVaultEnabled),
      vault,
      withdrawalRequests: withdrawalRequests || [],
      stats: {
        totalGrantedPoints,
        instantBonusPoints,
        unlockedQuarterPoints,
        lockedQuarterPoints,
        unlockedPoints,
        maxWithdrawable,
        cashValuePerPoint,
      },
    };
  }
}
