import { Injectable } from '@nestjs/common';
import { DocumentStatus, NotificationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateDocumentTypeDto, CreateEmployeeDocumentDto, UpdateDocumentTypeDto, VerifyEmployeeDocumentDto } from './dto/employee-document.dto';

@Injectable()
export class EmployeeDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  createType(dto: CreateDocumentTypeDto) {
    return this.prisma.documentType.create({
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        requiresExpiryDate: dto.requiresExpiryDate ?? false,
        requiresDocumentNumber: dto.requiresDocumentNumber ?? false,
        allowedMimeTypes: dto.allowedMimeTypes,
        maxFileSize: dto.maxFileSize,
      },
    });
  }

  findTypes(companyId?: string) {
    return this.prisma.documentType.findMany({
      where: { deletedAt: null, companyId },
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });
  }

  updateType(id: string, dto: UpdateDocumentTypeDto) {
    return this.prisma.documentType.update({ where: { id }, data: dto });
  }

  async create(dto: CreateEmployeeDocumentDto, actor: AuthenticatedUser) {
    const targetUserId = dto.userId ?? actor.userId;
    if (targetUserId !== actor.userId && !this.has(actor, 'employee_document.create')) {
      throw forbidden('EMPLOYEE_DOCUMENT_CREATE_FORBIDDEN', 'Cannot upload document for another employee');
    }
    if (targetUserId !== actor.userId && !this.has(actor, 'employee_document.read_all')) {
      throw forbidden('EMPLOYEE_DOCUMENT_CREATE_FORBIDDEN', 'Cannot upload document for another employee');
    }
    const [profile, type] = await Promise.all([
      this.prisma.employeeProfile.findUnique({ where: { userId: targetUserId } }),
      this.prisma.documentType.findUnique({ where: { id: dto.documentTypeId } }),
    ]);
    if (!profile) throw notFound('EMPLOYEE_PROFILE_NOT_FOUND', 'Employee profile not found');
    if (!type || type.deletedAt || !type.isActive) throw notFound('DOCUMENT_TYPE_NOT_FOUND', 'Document type not found');
    if (type.requiresExpiryDate && !dto.expiryDate) throw badRequest('DOCUMENT_EXPIRY_REQUIRED', 'Expiry date is required');
    if (type.requiresDocumentNumber && !dto.documentNumber) throw badRequest('DOCUMENT_NUMBER_REQUIRED', 'Document number is required');
    if (type.maxFileSize && dto.fileSize && dto.fileSize > type.maxFileSize) throw badRequest('DOCUMENT_FILE_TOO_LARGE', 'Document file is too large');

    const payload = await this.prisma.$transaction(async (tx) => {
      const document = await tx.employeeDocument.create({
        data: {
          employeeId: profile.id,
          userId: targetUserId,
          documentTypeId: dto.documentTypeId,
          type: type.code,
          fileName: dto.fileName,
          documentNumber: dto.documentNumber,
          title: dto.title,
          description: dto.description,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          issuedBy: dto.issuedBy,
          fileUrl: dto.fileUrl,
          storageKey: dto.storageKey,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          status: DocumentStatus.PENDING_VERIFICATION,
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: 'EMPLOYEE_DOCUMENT_CREATED',
          entityType: 'EmployeeDocument',
          entityId: document.id,
          metadata: { userId: targetUserId, documentType: type.code },
        },
      });
      const verifiers = await this.findVerifierIds(tx);
      const notification = await this.notifications.createForUsers(tx, verifiers, {
        type: NotificationType.DOCUMENT_VERIFICATION_REQUIRED,
        title: 'Document verification required',
        body: dto.title,
        metadata: { documentId: document.id, userId: targetUserId },
      });
      return { document, notification };
    });
    this.notifications.emitCreated(payload.notification);
    this.realtime.emitToUser(targetUserId, 'document:updated', { id: payload.document.id, status: payload.document.status });
    return this.serialize(payload.document, actor);
  }

  async findAll(actor: AuthenticatedUser, departmentId?: string) {
    if (this.has(actor, 'employee_document.read_all')) {
      const rows = await this.prisma.employeeDocument.findMany({ where: { deletedAt: null }, include: this.include(), orderBy: { createdAt: 'desc' } });
      return rows.map((row) => this.serialize(row, actor));
    }
    if (this.has(actor, 'employee_document.read_department')) {
      const visible = this.scope.visibleDepartmentIds(actor);
      const departmentIds = departmentId ? [departmentId] : visible;
      if (departmentId) this.scope.assertDepartmentAccess(actor, departmentId);
      const rows = await this.prisma.employeeDocument.findMany({
        where: { deletedAt: null, user: { departmentLinks: { some: { departmentId: departmentIds ? { in: departmentIds } : undefined, leftAt: null } } } },
        include: this.include(),
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((row) => this.serialize(row, actor));
    }
    return this.findMine(actor);
  }

  async findMine(actor: AuthenticatedUser) {
    const rows = await this.prisma.employeeDocument.findMany({
      where: { userId: actor.userId, deletedAt: null },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.serialize(row, actor));
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const document = await this.prisma.employeeDocument.findUnique({ where: { id }, include: this.include() });
    if (!document || document.deletedAt) throw notFound('EMPLOYEE_DOCUMENT_NOT_FOUND', 'Document not found');
    await this.assertCanRead(document.userId ?? document.employee.userId, actor);
    return this.serialize(document, actor);
  }

  async verify(id: string, dto: VerifyEmployeeDocumentDto, actor: AuthenticatedUser) {
    if (dto.status !== DocumentStatus.VERIFIED && dto.status !== DocumentStatus.REJECTED) {
      throw badRequest('INVALID_DOCUMENT_STATUS', 'Only VERIFIED or REJECTED is allowed');
    }
    const document = await this.prisma.employeeDocument.findUnique({ where: { id }, include: this.include() });
    if (!document || document.deletedAt) throw notFound('EMPLOYEE_DOCUMENT_NOT_FOUND', 'Document not found');
    const targetUserId = document.userId ?? document.employee.userId;
    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeDocument.update({
        where: { id },
        data: {
          status: dto.status,
          verifiedById: actor.userId,
          verifiedAt: new Date(),
          rejectionReason: dto.status === DocumentStatus.REJECTED ? dto.rejectionReason : null,
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: dto.status === DocumentStatus.VERIFIED ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
          entityType: 'EmployeeDocument',
          entityId: id,
          metadata: { userId: targetUserId, status: dto.status },
        },
      });
      const notification = await this.notifications.createForUsers(tx, [targetUserId], {
        type: dto.status === DocumentStatus.VERIFIED ? NotificationType.DOCUMENT_VERIFIED : NotificationType.DOCUMENT_REJECTED,
        title: dto.status === DocumentStatus.VERIFIED ? 'Document verified' : 'Document rejected',
        body: updated.title ?? updated.fileName,
        metadata: { documentId: id, status: dto.status },
      });
      return { updated, notification };
    });
    this.notifications.emitCreated(payload.notification);
    this.realtime.emitToUser(targetUserId, 'document:updated', { id, status: payload.updated.status });
    return this.serialize(payload.updated, actor);
  }

  async acknowledge(id: string, dto: { isAgreed: boolean; note?: string }, ipAddress: string, actor: AuthenticatedUser) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id, deletedAt: null },
      include: { employee: true },
    });
    if (!document) throw notFound('DOCUMENT_NOT_FOUND', 'Khong tim thay giay to');

    const targetUserId = document.userId ?? document.employee.userId;
    if (targetUserId !== actor.userId) {
      throw forbidden('DOCUMENT_ACKNOWLEDGE_FORBIDDEN', 'Ban chi duoc xac nhan giay to cua chinh minh');
    }

    if (document.acknowledgementStatus !== 'PENDING') {
      throw badRequest('DOCUMENT_ALREADY_ACKNOWLEDGED', 'Giay to nay da duoc xac nhan');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeDocument.update({
        where: { id },
        data: {
          acknowledgementStatus: dto.isAgreed ? 'AGREED' : 'DISAGREED',
          acknowledgedAt: new Date(),
          acknowledgementNote: dto.note,
          acknowledgedByIp: ipAddress,
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: dto.isAgreed ? 'DOCUMENT_AGREED' : 'DOCUMENT_DISAGREED',
          entityType: 'EmployeeDocument',
          entityId: id,
          metadata: { ipAddress, note: dto.note },
        },
      });
      return { updated };
    });
    
    this.realtime.emitToUser(targetUserId, 'document:acknowledged', { id, status: payload.updated.acknowledgementStatus });
    return this.serialize(payload.updated, actor);
  }


  expiring(days = 30) {
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.employeeDocument.findMany({
      where: { deletedAt: null, expiryDate: { gte: now, lte: until }, status: { in: [DocumentStatus.VERIFIED, DocumentStatus.PENDING_VERIFICATION] } },
      include: this.include(),
      orderBy: { expiryDate: 'asc' },
    });
  }

  private async assertCanRead(targetUserId: string, actor: AuthenticatedUser) {
    if (targetUserId === actor.userId && this.has(actor, 'employee_document.read_own')) return;
    if (this.has(actor, 'employee_document.read_all')) return;
    if (this.has(actor, 'employee_document.read_department')) {
      const departmentId = await this.scope.getPrimaryDepartmentId(targetUserId);
      this.scope.assertDepartmentAccess(actor, departmentId);
      return;
    }
    throw forbidden('EMPLOYEE_DOCUMENT_IDOR_DENIED', 'Cannot read this employee document');
  }

  private serialize(document: Prisma.EmployeeDocumentGetPayload<{ include: ReturnType<EmployeeDocumentsService['include']> }>, actor: AuthenticatedUser) {
    const canSensitive = this.has(actor, 'employee_document.read_sensitive') || document.userId === actor.userId || document.employee.userId === actor.userId;
    return {
      ...document,
      documentNumber: canSensitive ? document.documentNumber : this.mask(document.documentNumber),
      fileUrl: canSensitive ? document.fileUrl : undefined,
      storageKey: canSensitive ? document.storageKey : undefined,
    };
  }

  private include() {
    return { documentType: true, employee: true, user: true, verifiedBy: true } as const;
  }

  private mask(value?: string | null) {
    if (!value) return value;
    if (value.length <= 4) return '****';
    return `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
  }

  private has(actor: AuthenticatedUser, permission: string) {
    return actor.permissions.includes(permission);
  }

  private async findVerifierIds(tx: Prisma.TransactionClient) {
    const roles = await tx.userRole.findMany({
      where: { role: { permissions: { some: { permission: { code: 'employee_document.verify' } } } }, user: { isActive: true } },
      select: { userId: true },
    });
    return roles.map((role) => role.userId);
  }
}
