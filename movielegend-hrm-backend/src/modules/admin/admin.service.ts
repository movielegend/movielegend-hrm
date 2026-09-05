import { Injectable } from '@nestjs/common';
import { AccountStatus, ApprovalStatus, EmploymentStatus, Prisma, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { AssignRoleDto } from './dto/role-assignment.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LeaderAssignmentDto } from './dto/leader-assignment.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  GrantVaultPointsDto,
  BulkGrantVaultPointsDto,
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
  ) {}

  assignRole(dto: AssignRoleDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const [user, role] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId } }),
        tx.role.findUnique({ where: { id: dto.roleId } }),
      ]);
      if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy user');
      if (!role) throw notFound('ROLE_NOT_FOUND', 'Không tìm thấy role');

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

  async findUsers(query: UserQueryDto) {
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

  async findUser(id: string) {
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

  updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          phone: dto.phone,
          email: dto.email,
          accountStatus: dto.accountStatus,
          isActive: dto.isActive,
          isRewardVaultEnabled: dto.isRewardVaultEnabled,
          profile: dto.fullName || dto.positionId
            ? {
                update: {
                  fullName: dto.fullName,
                  positionId: dto.positionId,
                },
              }
            : undefined,
        },
        include: { profile: true },
      });
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

    const results = [];
    for (const uId of targetUserIds) {
      const res = await this.grantVaultPoints(
        {
          userId: uId,
          points: dto.points,
          year: dto.year,
          cashValuePerPoint: dto.cashValuePerPoint,
          grantType: dto.grantType,
          note: dto.note,
        },
        actor
      );
      results.push(res);
    }

    return {
      success: true,
      totalGrantedUsers: results.length,
      pointsPerUser: dto.points,
      grantType: dto.grantType || 'ANNUAL',
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
        include: { milestones: { orderBy: { quarter: 'asc' } } },
      });
      if (!vault) throw notFound('VAULT_NOT_FOUND', 'Chưa tìm thấy ví thưởng của năm hiện tại');

      const instantBonusPoints = vault.instantBonusPoints || 0;
      const cashValuePerPoint = Number(vault.cashValuePerPoint || 1000);
      const unwithdrawnMilestones = vault.milestones.filter((m) => !m.isWithdrawn && m.pointsToUnlock > 0);
      const totalMilestonePoints = unwithdrawnMilestones.reduce((s, m) => s + m.pointsToUnlock, 0);
      const maxWithdrawable = instantBonusPoints + totalMilestonePoints;

      if (dto.points > maxWithdrawable) {
        throw badRequest(
          'EXCEEDS_MAX_WITHDRAWABLE',
          `Số điểm yêu cầu rút (${dto.points.toLocaleString('vi-VN')} điểm) vượt quá tổng hạn mức khả dụng (${maxWithdrawable.toLocaleString('vi-VN')} điểm)`
        );
      }

      let remainingToDeduct = dto.points;
      let deductedInstant = 0;
      const now = new Date();

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

      // 2. Deduct from currently unlocked milestones (unlockDate <= now)
      const unlockedMilestones = vault.milestones.filter(
        (m) => !m.isWithdrawn && m.pointsToUnlock > 0 && new Date(m.unlockDate) <= now
      );
      for (const m of unlockedMilestones) {
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

      // 3. Reverse Waterfall: Deduct from future locked quarters starting from highest quarter downwards (Q4 -> Q3 -> Q2 -> Q1)
      if (remainingToDeduct > 0) {
        const futureMilestones = vault.milestones
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
      const request = await tx.rewardWithdrawalRequest.create({
        data: {
          userId,
          pointsWithdrawn: dto.points,
          cashAmount: totalCash,
          bankName: dto.bankName,
          bankAccountNumber: dto.bankAccountNumber,
          bankAccountName: dto.bankAccountName,
          note: dto.note || undefined,
          status: 'PENDING_ADMIN',
        },
      });

      // 5. Send Notifications
      // 5.1 Notify Admins
      const adminUsers = await tx.userRole.findMany({
        where: { role: { code: 'ADMIN' } },
        select: { userId: true },
      });
      const adminIds = [...new Set(adminUsers.map((u) => u.userId))];
      const employeeName = user.profile?.fullName || user.userCode;

      if (adminIds.length > 0) {
        const adminNotif = await this.notifications.createForUsers(tx as any, adminIds, {
          type: 'SYSTEM' as NotificationType,
          title: 'Yêu cầu rút Ví Thưởng mới ⏳',
          body: `Nhân viên ${employeeName} vừa gửi yêu cầu rút ${dto.points.toLocaleString('vi-VN')} điểm (~${totalCash.toLocaleString('vi-VN')} VNĐ) về tài khoản ${dto.bankName}. Vui lòng phê duyệt.`,
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
            milestones: { orderBy: { quarter: 'asc' } },
            transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        }),
      };
    });
  }

  async getVaultWithdrawalRequests(query: WithdrawalQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RewardWithdrawalRequestWhereInput = {};

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
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PENDING_ADMIN' } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PENDING_ACCOUNTANT' } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'PAID' } }),
      this.prisma.rewardWithdrawalRequest.count({ where: { status: 'REJECTED' } }),
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
          title: 'Lệnh chi tiền Ví Thưởng Tết 💼',
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

    (vault.milestones || []).forEach((m) => {
      if (!m.isWithdrawn && m.pointsToUnlock > 0) {
        if (new Date(m.unlockDate) <= now) {
          unlockedQuarterPoints += m.pointsToUnlock;
        } else {
          lockedQuarterPoints += m.pointsToUnlock;
        }
      }
    });

    const unlockedPoints = instantBonusPoints + unlockedQuarterPoints;
    const maxWithdrawable = unlockedPoints + lockedQuarterPoints;

    return {
      isVaultEnabled: Boolean(user.isRewardVaultEnabled),
      vault,
      withdrawalRequests: withdrawalRequests || [],
      stats: {
        totalGrantedPoints: vault.grantedPoints,
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
