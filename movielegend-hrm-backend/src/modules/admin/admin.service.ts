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

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
      const [user, department, leaderRole] = await Promise.all([
        tx.user.findUnique({ where: { id: dto.userId } }),
        tx.department.findFirst({ where: { id: dto.departmentId, deletedAt: null, isActive: true } }),
        tx.role.findUnique({ where: { code: 'LEADER' } }),
      ]);
      if (!user || user.accountStatus !== AccountStatus.ACTIVE || !user.isActive) {
        throw badRequest('USER_NOT_ACTIVE', 'User chưa active');
      }
      if (!department) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
      if (!leaderRole) throw notFound('ROLE_NOT_FOUND', 'Không tìm thấy role LEADER');

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
      if (dto.primary ?? true) {
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
          metadata: { departmentId: dto.departmentId },
        },
      });
      return assignment;
    });
  }

  async revokeLeader(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.userRole.delete({ where: { id } });
      if (assignment.scopeId) {
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
          departmentLinks: { include: { department: true, position: true } },
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
        departmentLinks: { include: { department: true, position: true } },
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
        await tx.departmentMember.upsert({
          where: { departmentId_userId: { departmentId: dto.departmentId, userId: id } },
          create: { departmentId: dto.departmentId, userId: id, positionId: dto.positionId },
          update: { leftAt: null, positionId: dto.positionId },
        });
      }
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
}
