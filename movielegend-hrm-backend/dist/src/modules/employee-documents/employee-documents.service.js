"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let EmployeeDocumentsService = class EmployeeDocumentsService {
    prisma;
    scope;
    notifications;
    realtime;
    constructor(prisma, scope, notifications, realtime) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
        this.realtime = realtime;
    }
    createType(dto) {
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
    findTypes(companyId) {
        return this.prisma.documentType.findMany({
            where: { deletedAt: null, companyId },
            orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
        });
    }
    updateType(id, dto) {
        return this.prisma.documentType.update({ where: { id }, data: dto });
    }
    async create(dto, actor) {
        const targetUserId = dto.userId ?? actor.userId;
        if (targetUserId !== actor.userId && !this.has(actor, 'employee_document.create')) {
            throw (0, error_util_1.forbidden)('EMPLOYEE_DOCUMENT_CREATE_FORBIDDEN', 'Cannot upload document for another employee');
        }
        if (targetUserId !== actor.userId && !this.has(actor, 'employee_document.read_all')) {
            throw (0, error_util_1.forbidden)('EMPLOYEE_DOCUMENT_CREATE_FORBIDDEN', 'Cannot upload document for another employee');
        }
        const [profile, type] = await Promise.all([
            this.prisma.employeeProfile.findUnique({ where: { userId: targetUserId } }),
            this.prisma.documentType.findUnique({ where: { id: dto.documentTypeId } }),
        ]);
        if (!profile)
            throw (0, error_util_1.notFound)('EMPLOYEE_PROFILE_NOT_FOUND', 'Employee profile not found');
        if (!type || type.deletedAt || !type.isActive)
            throw (0, error_util_1.notFound)('DOCUMENT_TYPE_NOT_FOUND', 'Document type not found');
        if (type.requiresExpiryDate && !dto.expiryDate)
            throw (0, error_util_1.badRequest)('DOCUMENT_EXPIRY_REQUIRED', 'Expiry date is required');
        if (type.requiresDocumentNumber && !dto.documentNumber)
            throw (0, error_util_1.badRequest)('DOCUMENT_NUMBER_REQUIRED', 'Document number is required');
        if (type.maxFileSize && dto.fileSize && dto.fileSize > type.maxFileSize)
            throw (0, error_util_1.badRequest)('DOCUMENT_FILE_TOO_LARGE', 'Document file is too large');
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
                    status: client_1.DocumentStatus.PENDING_VERIFICATION,
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
                type: client_1.NotificationType.DOCUMENT_VERIFICATION_REQUIRED,
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
    async findAll(actor, departmentId) {
        if (this.has(actor, 'employee_document.read_all')) {
            const rows = await this.prisma.employeeDocument.findMany({ where: { deletedAt: null }, include: this.include(), orderBy: { createdAt: 'desc' } });
            return rows.map((row) => this.serialize(row, actor));
        }
        if (this.has(actor, 'employee_document.read_department')) {
            const visible = this.scope.visibleDepartmentIds(actor);
            const departmentIds = departmentId ? [departmentId] : visible;
            if (departmentId)
                this.scope.assertDepartmentAccess(actor, departmentId);
            const rows = await this.prisma.employeeDocument.findMany({
                where: { deletedAt: null, user: { departmentLinks: { some: { departmentId: departmentIds ? { in: departmentIds } : undefined, leftAt: null } } } },
                include: this.include(),
                orderBy: { createdAt: 'desc' },
            });
            return rows.map((row) => this.serialize(row, actor));
        }
        return this.findMine(actor);
    }
    async findMine(actor) {
        const rows = await this.prisma.employeeDocument.findMany({
            where: { userId: actor.userId, deletedAt: null },
            include: this.include(),
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((row) => this.serialize(row, actor));
    }
    async findOne(id, actor) {
        const document = await this.prisma.employeeDocument.findUnique({ where: { id }, include: this.include() });
        if (!document || document.deletedAt)
            throw (0, error_util_1.notFound)('EMPLOYEE_DOCUMENT_NOT_FOUND', 'Document not found');
        await this.assertCanRead(document.userId ?? document.employee.userId, actor);
        return this.serialize(document, actor);
    }
    async verify(id, dto, actor) {
        if (dto.status !== client_1.DocumentStatus.VERIFIED && dto.status !== client_1.DocumentStatus.REJECTED) {
            throw (0, error_util_1.badRequest)('INVALID_DOCUMENT_STATUS', 'Only VERIFIED or REJECTED is allowed');
        }
        const document = await this.prisma.employeeDocument.findUnique({ where: { id }, include: this.include() });
        if (!document || document.deletedAt)
            throw (0, error_util_1.notFound)('EMPLOYEE_DOCUMENT_NOT_FOUND', 'Document not found');
        const targetUserId = document.userId ?? document.employee.userId;
        const payload = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.employeeDocument.update({
                where: { id },
                data: {
                    status: dto.status,
                    verifiedById: actor.userId,
                    verifiedAt: new Date(),
                    rejectionReason: dto.status === client_1.DocumentStatus.REJECTED ? dto.rejectionReason : null,
                },
                include: this.include(),
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: dto.status === client_1.DocumentStatus.VERIFIED ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
                    entityType: 'EmployeeDocument',
                    entityId: id,
                    metadata: { userId: targetUserId, status: dto.status },
                },
            });
            const notification = await this.notifications.createForUsers(tx, [targetUserId], {
                type: dto.status === client_1.DocumentStatus.VERIFIED ? client_1.NotificationType.DOCUMENT_VERIFIED : client_1.NotificationType.DOCUMENT_REJECTED,
                title: dto.status === client_1.DocumentStatus.VERIFIED ? 'Document verified' : 'Document rejected',
                body: updated.title ?? updated.fileName,
                metadata: { documentId: id, status: dto.status },
            });
            return { updated, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(targetUserId, 'document:updated', { id, status: payload.updated.status });
        return this.serialize(payload.updated, actor);
    }
    async acknowledge(id, dto, ipAddress, actor) {
        const document = await this.prisma.employeeDocument.findUnique({
            where: { id, deletedAt: null },
            include: { employee: true },
        });
        if (!document)
            throw (0, error_util_1.notFound)('DOCUMENT_NOT_FOUND', 'Khong tim thay giay to');
        const targetUserId = document.userId ?? document.employee.userId;
        if (targetUserId !== actor.userId) {
            throw (0, error_util_1.forbidden)('DOCUMENT_ACKNOWLEDGE_FORBIDDEN', 'Ban chi duoc xac nhan giay to cua chinh minh');
        }
        if (document.acknowledgementStatus !== 'PENDING') {
            throw (0, error_util_1.badRequest)('DOCUMENT_ALREADY_ACKNOWLEDGED', 'Giay to nay da duoc xac nhan');
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
            where: { deletedAt: null, expiryDate: { gte: now, lte: until }, status: { in: [client_1.DocumentStatus.VERIFIED, client_1.DocumentStatus.PENDING_VERIFICATION] } },
            include: this.include(),
            orderBy: { expiryDate: 'asc' },
        });
    }
    async assertCanRead(targetUserId, actor) {
        if (targetUserId === actor.userId && this.has(actor, 'employee_document.read_own'))
            return;
        if (this.has(actor, 'employee_document.read_all'))
            return;
        if (this.has(actor, 'employee_document.read_department')) {
            const departmentId = await this.scope.getPrimaryDepartmentId(targetUserId);
            this.scope.assertDepartmentAccess(actor, departmentId);
            return;
        }
        throw (0, error_util_1.forbidden)('EMPLOYEE_DOCUMENT_IDOR_DENIED', 'Cannot read this employee document');
    }
    serialize(document, actor) {
        const canSensitive = this.has(actor, 'employee_document.read_sensitive') || document.userId === actor.userId || document.employee.userId === actor.userId;
        return {
            ...document,
            documentNumber: canSensitive ? document.documentNumber : this.mask(document.documentNumber),
            fileUrl: canSensitive ? document.fileUrl : undefined,
            storageKey: canSensitive ? document.storageKey : undefined,
        };
    }
    include() {
        return { documentType: true, employee: true, user: true, verifiedBy: true };
    }
    mask(value) {
        if (!value)
            return value;
        if (value.length <= 4)
            return '****';
        return `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
    }
    has(actor, permission) {
        return actor.permissions.includes(permission);
    }
    async findVerifierIds(tx) {
        const roles = await tx.userRole.findMany({
            where: { role: { permissions: { some: { permission: { code: 'employee_document.verify' } } } }, user: { isActive: true } },
            select: { userId: true },
        });
        return roles.map((role) => role.userId);
    }
};
exports.EmployeeDocumentsService = EmployeeDocumentsService;
exports.EmployeeDocumentsService = EmployeeDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService])
], EmployeeDocumentsService);
//# sourceMappingURL=employee-documents.service.js.map