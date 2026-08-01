import { Injectable } from '@nestjs/common';
import { AccountStatus, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound, forbidden } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { StorageService } from '../storage/storage.service';
import { MediaStorageService } from '../storage/media-storage.service';
import { ScopedEmployeeQueryDto } from './dto/scoped-employee-query.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly storage: StorageService,
    private readonly mediaStorage: MediaStorageService,
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
    let allowedDeptIds: string[] | null = null;
    
    if (actor.roles.includes('ADMIN') || actor.roles.includes('HR')) {
      allowedDeptIds = null;
    } else {
      const leaderDepts = actor.scopes
        .filter((s) => s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId)
        .map((s) => s.scopeId as string);
        
      if (leaderDepts.length > 0) {
        allowedDeptIds = leaderDepts;
      } else {
        const userDepts = await this.prisma.departmentMember.findMany({
          where: { userId: actor.userId, leftAt: null },
          select: { departmentId: true }
        });
        allowedDeptIds = userDepts.map(d => d.departmentId);
      }
    }

    if (query.departmentId && allowedDeptIds !== null && !allowedDeptIds.includes(query.departmentId)) {
      throw forbidden('FORBIDDEN_DEPARTMENT_SCOPE', 'Bạn không có quyền xem nhân viên phòng ban này');
    }

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.accountStatus ? { accountStatus: query.accountStatus } : {}),
      ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { userCode: { contains: query.search, mode: 'insensitive' } },
              { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(query.departmentId
        ? {
            departmentLinks: {
              some: {
                leftAt: null,
                departmentId: query.departmentId,
              },
            },
          }
        : allowedDeptIds !== null
        ? {
            departmentLinks: {
              some: {
                leftAt: null,
                departmentId: { in: allowedDeptIds },
              },
            },
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          userCode: true,
          accountStatus: true,
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
          accountStatus: item.accountStatus,
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
    let profile = await this.prisma.employeeProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      select: { id: true, userId: true, avatarUrl: true },
    });
    const targetUserId = profile?.userId || id;
    const userExists = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!userExists) throw notFound('EMPLOYEE_NOT_FOUND', 'Không tìm thấy nhân viên');

    // Tìm các ảnh khuôn mặt trước khi xóa DB
    const faceProfile = await this.prisma.faceProfile.findUnique({
      where: { userId: targetUserId },
      include: { images: true }
    });

    await this.prisma.$transaction(async (tx) => {
      // Xóa các bảng có ràng buộc Restrict trước khi xóa user
      await tx.employeeProfile.deleteMany({ where: { userId: targetUserId } });
      await tx.departmentMember.deleteMany({ where: { userId: targetUserId } });
      await tx.userRole.deleteMany({ where: { userId: targetUserId } });

      await tx.user.delete({
        where: { id: targetUserId },
      });

      // Ghi log xóa
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'employee.delete',
          entityType: 'User',
          entityId: targetUserId,
          metadata: { profileId: profile?.id || id },
        },
      });
    });

    // Sau khi xóa DB thành công, thực hiện xóa file vật lý
    if (profile?.avatarUrl) {
      const avatarKey = this.mediaStorage.extractKeyFromUrl(profile.avatarUrl);
      if (avatarKey) {
        await this.mediaStorage.delete(avatarKey).catch(e => console.error(`Lỗi xóa avatar cũ: ${avatarKey}`, e));
      }
    }

    if (faceProfile?.images?.length) {
      for (const img of faceProfile.images) {
        const faceKey = this.storage.extractKeyFromUrl(img.imageUrl);
        if (faceKey) {
          await this.storage.delete(faceKey).catch(e => console.error(`Lỗi xóa ảnh khuôn mặt: ${faceKey}`, e));
        }
      }
    }

    return { success: true };
  }
}
