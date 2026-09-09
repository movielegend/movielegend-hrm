import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma, RoleScopeType, UploadPurpose } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateDepartmentDocumentDto } from './dto/create-department-document.dto';
import { QueryDepartmentDocumentDto } from './dto/query-department-document.dto';

@Injectable()
export class DepartmentDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly uploadsService: UploadsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Lấy danh sách ID phòng ban mà user trực thuộc */
  private async getUserDepartmentIds(actor: AuthenticatedUser): Promise<string[]> {
    const members = await this.prisma.departmentMember.findMany({
      where: { userId: actor.userId, leftAt: null },
      select: { departmentId: true },
    });
    const ids = new Set<string>(members.map((m) => m.departmentId));

    // Thêm các phòng ban mà user có scope LEADER
    actor.scopes?.forEach((s) => {
      if (s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId) {
        ids.add(s.scopeId);
      }
    });

    return Array.from(ids);
  }

  /** Xác định danh sách user nhận thông báo theo đúng Role & Scope */
  private async resolveRecipientUserIds(
    departmentId: string | null | undefined,
    uploaderUserId: string,
    dept?: { leaderUserId: string | null; branch?: { regionId: string | null } | null } | null,
  ): Promise<string[]> {
    const recipientIds = new Set<string>();

    if (!departmentId) {
      // 1. Tài liệu toàn công ty: Gửi cho tất cả nhân sự đang hoạt động trong hệ thống
      const activeUsers = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          id: { not: uploaderUserId },
        },
        select: { id: true },
      });
      return activeUsers.map((u) => u.id);
    }

    // 2. Tài liệu theo phòng ban:
    // a. Thành viên trực thuộc phòng ban (nhân viên, HR/kế toán thuộc phòng này)
    const members = await this.prisma.departmentMember.findMany({
      where: {
        departmentId,
        leftAt: null,
        user: { deletedAt: null, isActive: true },
      },
      select: { userId: true },
    });
    members.forEach((m) => recipientIds.add(m.userId));

    // b. Trưởng phòng ban (Leader)
    if (dept?.leaderUserId) {
      recipientIds.add(dept.leaderUserId);
    }

    // c. Các Leader có UserRole gán scope DEPARTMENT cho phòng ban này
    const scopedLeaders = await this.prisma.userRole.findMany({
      where: {
        role: { code: 'LEADER' },
        scopeType: RoleScopeType.DEPARTMENT,
        scopeId: departmentId,
        user: { deletedAt: null, isActive: true },
      },
      select: { userId: true },
    });
    scopedLeaders.forEach((r) => recipientIds.add(r.userId));

    // d. Admin Miền quản lý phòng ban này (thông qua branch.regionId)
    if (dept?.branch?.regionId) {
      const regionAdmins = await this.prisma.userRole.findMany({
        where: {
          role: { code: 'ADMIN' },
          scopeType: RoleScopeType.REGION,
          scopeId: dept.branch.regionId,
          user: { deletedAt: null, isActive: true },
        },
        select: { userId: true },
      });
      regionAdmins.forEach((r) => recipientIds.add(r.userId));
    }

    // e. Super Admin / Admin Tổng (GLOBAL scope)
    const globalAdmins = await this.prisma.userRole.findMany({
      where: {
        role: { code: 'ADMIN' },
        scopeType: RoleScopeType.GLOBAL,
        user: { deletedAt: null, isActive: true },
      },
      select: { userId: true },
    });
    globalAdmins.forEach((r) => recipientIds.add(r.userId));

    // Loại trừ chính người vừa đăng tải tài liệu
    recipientIds.delete(uploaderUserId);

    return Array.from(recipientIds);
  }

  /** Tạo mới tài liệu */
  async create(dto: CreateDepartmentDocumentDto, actor: AuthenticatedUser) {
    let companyId: string | null = null;
    let dept: any = null;

    if (!dto.departmentId) {
      // Chỉ Super Admin mới được đăng tài liệu toàn công ty
      if (!this.scope.isGlobalAdmin(actor)) {
        throw forbidden('GLOBAL_DOCUMENT_REQUIRES_SUPER_ADMIN', 'Chỉ Admin tổng mới có quyền đăng tài liệu toàn công ty');
      }
      const firstCompany = await this.prisma.company.findFirst({ where: { deletedAt: null }, select: { id: true } });
      if (!firstCompany) throw notFound('COMPANY_NOT_FOUND', 'Không tìm thấy công ty');
      companyId = firstCompany.id;
    } else {
      dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId, deletedAt: null },
        include: { branch: true },
      });
      if (!dept) throw notFound('DEPARTMENT_NOT_FOUND', 'Phòng ban không tồn tại');
      companyId = dept.companyId;

      // Kiểm tra quyền đăng theo phòng ban
      if (this.scope.isGlobalAdmin(actor)) {
        // Super Admin có quyền đăng cho bất kỳ phòng ban nào
      } else if (this.scope.isRegionAdmin(actor)) {
        // Admin Miền chỉ được đăng cho các phòng ban trong miền mình
        const canAccess = await this.scope.canAccessDepartmentAsync(actor, dto.departmentId);
        if (!canAccess) {
          throw forbidden('REGION_SCOPE_FORBIDDEN', 'Bạn chỉ có quyền đăng tài liệu cho các phòng ban thuộc miền của mình');
        }
      } else if (actor.roles.includes('LEADER')) {
        // Leader chỉ được đăng cho phòng ban mình phụ trách
        const userDeptIds = await this.getUserDepartmentIds(actor);
        if (!userDeptIds.includes(dto.departmentId) && dept.leaderUserId !== actor.userId) {
          throw forbidden('LEADER_SCOPE_FORBIDDEN', 'Bạn chỉ có quyền đăng tài liệu cho phòng ban của mình');
        }
      } else {
        // Nhân viên thường, HR, Kế toán không có quyền đăng tài liệu phòng ban nếu không phải Leader/Admin
        throw forbidden('DOCUMENT_CREATE_FORBIDDEN', 'Bạn không có quyền tải lên tài liệu cho phòng ban này');
      }
    }

    if (!companyId) {
      throw badRequest('COMPANY_REQUIRED', 'Không xác định được công ty');
    }

    // Xác định trước danh sách người nhận thông báo theo đúng role và scope
    const targetUserIds = await this.resolveRecipientUserIds(
      dto.departmentId,
      actor.userId,
      dept,
    );

    const notifTitle = dto.departmentId
      ? 'Tài liệu phòng ban mới'
      : 'Tài liệu nội bộ mới';
    const notifBody = dto.departmentId
      ? `Phòng ${dept?.name || 'ban'} vừa có tài liệu mới: "${dto.title.trim()}".`
      : `Tài liệu toàn công ty "${dto.title.trim()}" vừa được phát hành.`;

    const { formatted, notifPayload } = await this.prisma.$transaction(async (tx) => {
      if (dto.fileId) {
        await this.uploadsService.attachTemporaryFiles(
          [dto.fileId],
          actor.userId,
          UploadPurpose.EMPLOYEE_DOCUMENT,
          tx,
        );
      }

      const created = await tx.departmentDocument.create({
        data: {
          companyId,
          departmentId: dto.departmentId || null,
          title: dto.title.trim(),
          description: dto.description?.trim(),
          category: dto.category || 'GENERAL',
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          storageKey: dto.storageKey,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          uploadedById: actor.userId,
        },
        include: this.documentInclude(),
      });

      let notifResult = null;
      if (targetUserIds.length > 0) {
        notifResult = await this.notificationsService.createForUsers(tx, targetUserIds, {
          type: NotificationType.SYSTEM,
          title: notifTitle,
          body: notifBody,
          metadata: {
            documentId: created.id,
            departmentId: created.departmentId,
            screen: 'DocumentList',
          },
        });
      }

      return { formatted: this.formatDocument(created), notifPayload: notifResult };
    });

    if (notifPayload) {
      this.notificationsService.emitCreated(notifPayload);
    }

    return formatted;
  }


  /** Lấy danh sách tài liệu theo đúng Scope phân quyền */
  async findAll(query: QueryDepartmentDocumentDto, actor: AuthenticatedUser) {
    const where: Prisma.DepartmentDocumentWhereInput = {
      deletedAt: null,
    };

    // 1. Phân quyền xem (Scoping)
    if (this.scope.isGlobalAdmin(actor)) {
      // Super Admin: xem được hết (toàn bộ các phòng ban + toàn công ty)
      if (query.departmentId) {
        where.departmentId = query.departmentId;
      }
    } else if (this.scope.isRegionAdmin(actor)) {
      // Admin Miền: xem các phòng ban trong Miền của mình + tài liệu toàn công ty
      const regionDeptIds = (await this.scope.getVisibleDepartmentIds(actor)) || [];
      if (query.departmentId) {
        if (!regionDeptIds.includes(query.departmentId)) {
          throw forbidden('REGION_SCOPE_FORBIDDEN', 'Phòng ban này không thuộc miền quản lý của bạn');
        }
        where.departmentId = query.departmentId;
      } else {
        where.OR = [
          { departmentId: { in: regionDeptIds } },
          { departmentId: null }, // Tài liệu chung toàn công ty
        ];
      }
    } else {
      // Leader, Nhân viên (Employee), HR, Kế toán (Accountant):
      // ĐÚNG YÊU CẦU: CHỈ XEM ĐƯỢC PHÒNG MÌNH (+ tài liệu toàn công ty)
      const userDeptIds = await this.getUserDepartmentIds(actor);
      if (query.departmentId) {
        if (!userDeptIds.includes(query.departmentId)) {
          throw forbidden('DEPARTMENT_SCOPE_FORBIDDEN', 'Bạn chỉ có thể xem tài liệu phòng ban của mình');
        }
        where.departmentId = query.departmentId;
      } else {
        where.OR = [
          { departmentId: { in: userDeptIds } },
          { departmentId: null }, // Tài liệu chung toàn công ty
        ];
      }
    }

    // 2. Bộ lọc danh mục
    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    // 3. Tìm kiếm từ khóa
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: s, mode: 'insensitive' } },
            { fileName: { contains: s, mode: 'insensitive' } },
            { description: { contains: s, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.departmentDocument.findMany({
        where,
        include: this.documentInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.departmentDocument.count({ where }),
    ]);

    return {
      items: items.map((doc) => this.formatDocument(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Xem chi tiết 1 tài liệu */
  async findOne(id: string, actor: AuthenticatedUser) {
    const doc = await this.prisma.departmentDocument.findUnique({
      where: { id, deletedAt: null },
      include: this.documentInclude(),
    });
    if (!doc) throw notFound('DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại');

    // Kiểm tra quyền xem
    if (doc.departmentId) {
      if (this.scope.isGlobalAdmin(actor)) {
        // OK
      } else if (this.scope.isRegionAdmin(actor)) {
        const canAccess = await this.scope.canAccessDepartmentAsync(actor, doc.departmentId);
        if (!canAccess) throw forbidden('REGION_SCOPE_FORBIDDEN', 'Tài liệu không thuộc miền của bạn');
      } else {
        const userDeptIds = await this.getUserDepartmentIds(actor);
        if (!userDeptIds.includes(doc.departmentId)) {
          throw forbidden('DEPARTMENT_SCOPE_FORBIDDEN', 'Bạn không có quyền xem tài liệu của phòng ban này');
        }
      }
    }

    return this.formatDocument(doc);
  }

  /** Xóa tài liệu (Soft delete) */
  async remove(id: string, actor: AuthenticatedUser) {
    const doc = await this.prisma.departmentDocument.findUnique({
      where: { id, deletedAt: null },
    });
    if (!doc) throw notFound('DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại');

    // Quyền xóa:
    // - Super Admin: xóa được hết
    // - Region Admin: xóa được tài liệu trong miền mình
    // - Leader: xóa được tài liệu trong phòng mình hoặc do mình tải lên
    // - Người tạo: xóa được tài liệu do chính mình tải lên
    if (this.scope.isGlobalAdmin(actor)) {
      // OK
    } else if (this.scope.isRegionAdmin(actor)) {
      if (doc.departmentId) {
        const canAccess = await this.scope.canAccessDepartmentAsync(actor, doc.departmentId);
        if (!canAccess) throw forbidden('REGION_SCOPE_FORBIDDEN', 'Không có quyền xóa tài liệu ngoài miền');
      } else {
        throw forbidden('GLOBAL_DOC_DELETE_FORBIDDEN', 'Chỉ Super Admin mới có quyền xóa tài liệu toàn công ty');
      }
    } else if (actor.roles.includes('LEADER')) {
      const userDeptIds = await this.getUserDepartmentIds(actor);
      const isMyDept = doc.departmentId && userDeptIds.includes(doc.departmentId);
      const isUploader = doc.uploadedById === actor.userId;
      if (!isMyDept && !isUploader) {
        throw forbidden('DELETE_FORBIDDEN', 'Bạn không có quyền xóa tài liệu này');
      }
    } else if (doc.uploadedById === actor.userId) {
      // Chính người upload xóa
    } else {
      throw forbidden('DELETE_FORBIDDEN', 'Bạn không có quyền xóa tài liệu này');
    }

    return this.prisma.departmentDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private documentInclude() {
    return {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              region: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      },
      uploadedBy: {
        select: {
          id: true,
          userCode: true,
          phone: true,
          profile: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    };
  }

  private formatDocument<T extends Record<string, any>>(doc: T): T {
    if (!doc) return doc;
    return {
      ...doc,
      uploadedBy: doc.uploadedBy
        ? {
            ...doc.uploadedBy,
            fullName: doc.uploadedBy.profile?.fullName || 'Hệ thống',
          }
        : null,
    };
  }
}
