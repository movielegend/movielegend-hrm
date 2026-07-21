import { Injectable } from '@nestjs/common';
import { AccountStatus, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  async findOne(id: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            phone: true,
            email: true,
            accountStatus: true,
            approvalStatus: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
        bankAccounts: true,
        documents: true,
        position: true,
      },
    });
    if (!profile) throw notFound('EMPLOYEE_NOT_FOUND', 'Không tìm thấy hồ sơ nhân viên');
    return profile;
  }

  async scoped(actor: AuthenticatedUser, query: ScopedEmployeeQueryDto) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    if (query.departmentId && visibleDepartmentIds && !visibleDepartmentIds.includes(query.departmentId)) {
      this.scope.assertDepartmentAccess(actor, query.departmentId);
    }
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      accountStatus: AccountStatus.ACTIVE,
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { userCode: { contains: query.search, mode: 'insensitive' } },
              { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      departmentLinks: {
        some: {
          leftAt: null,
          ...(query.departmentId ? { departmentId: query.departmentId } : visibleDepartmentIds ? { departmentId: { in: visibleDepartmentIds } } : {}),
        },
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          userCode: true,
          isActive: true,
          profile: { select: { fullName: true, avatarUrl: true, employmentStatus: true } },
          departmentLinks: {
            where: { leftAt: null, ...(query.departmentId ? { departmentId: query.departmentId } : {}) },
            take: 1,
            include: {
              department: { select: { id: true, name: true } },
              position: { select: { id: true, name: true } },
            },
          },
          roles: {
            include: { role: true }
          }
        },
        orderBy: { userCode: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((item) => {
        const link = item.departmentLinks[0];
        return {
          id: item.id,
          userCode: item.userCode,
          fullName: item.profile?.fullName ?? null,
          avatarUrl: item.profile?.avatarUrl ?? null,
          department: link?.department ?? null,
          position: link?.position ?? null,
          employmentStatus: item.profile?.employmentStatus ?? null,
          isActive: item.isActive,
          roles: item.roles,
        };
      }),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async remove(id: string, actorUserId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!profile) throw notFound('EMPLOYEE_NOT_FOUND', 'Không tìm thấy hồ sơ nhân viên');

    await this.prisma.$transaction(async (tx) => {
      // Xóa cứng user (tự động xóa cascade profile, departmentMember, faceProfile, etc.)
      await tx.user.delete({
        where: { id: profile.userId },
      });

      // Ghi log xóa
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'employee.delete',
          entityType: 'User',
          entityId: profile.userId,
          metadata: { profileId: id },
        },
      });
    });

    return { success: true };
  }
}
