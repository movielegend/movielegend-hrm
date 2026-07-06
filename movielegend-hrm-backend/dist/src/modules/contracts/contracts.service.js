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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
const contract_state_policy_service_1 = require("./contract-state-policy.service");
const document_integrity_service_1 = require("./document-integrity.service");
let ContractsService = class ContractsService {
    prisma;
    scope;
    notifications;
    realtime;
    policy;
    integrity;
    constructor(prisma, scope, notifications, realtime, policy, integrity) {
        this.prisma = prisma;
        this.scope = scope;
        this.notifications = notifications;
        this.realtime = realtime;
        this.policy = policy;
        this.integrity = integrity;
    }
    async createTemplate(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.contractTemplate.create({
                data: { ...dto, createdById: actor.userId },
            });
            await tx.contractTemplateVersion.create({
                data: {
                    contractTemplateId: template.id,
                    versionNumber: 1,
                    templateFileUrl: dto.templateFileUrl,
                    storageKey: dto.storageKey,
                    contentHash: this.integrity.sha256(dto.templateFileUrl),
                    createdById: actor.userId,
                },
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'CONTRACT_TEMPLATE_CREATED', entityType: 'ContractTemplate', entityId: template.id } });
            return template;
        });
    }
    findTemplates() {
        return this.prisma.contractTemplate.findMany({ where: { deletedAt: null }, include: { versions: true }, orderBy: { createdAt: 'desc' } });
    }
    async findTemplate(id) {
        const template = await this.prisma.contractTemplate.findUnique({ where: { id }, include: { versions: true } });
        if (!template || template.deletedAt)
            throw (0, error_util_1.notFound)('CONTRACT_TEMPLATE_NOT_FOUND', 'Contract template not found');
        return template;
    }
    async updateTemplate(id, dto, actor) {
        const current = await this.findTemplate(id);
        return this.prisma.$transaction(async (tx) => {
            const nextVersion = current.version + 1;
            const template = await tx.contractTemplate.update({
                where: { id },
                data: { name: dto.name, description: dto.description, templateFileUrl: dto.templateFileUrl ?? current.templateFileUrl, storageKey: dto.storageKey, version: nextVersion },
            });
            if (dto.templateFileUrl) {
                await tx.contractTemplateVersion.create({
                    data: {
                        contractTemplateId: id,
                        versionNumber: nextVersion,
                        templateFileUrl: dto.templateFileUrl,
                        storageKey: dto.storageKey,
                        contentHash: this.integrity.sha256(dto.templateFileUrl),
                        createdById: actor.userId,
                    },
                });
            }
            return template;
        });
    }
    async createContract(dto, actor) {
        const [target, version] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: dto.userId }, include: { profile: { include: { position: true } }, departmentLinks: { where: { leftAt: null }, include: { department: true } } } }),
            this.prisma.contractTemplateVersion.findUnique({ where: { id: dto.contractTemplateVersionId }, include: { contractTemplate: true } }),
        ]);
        if (!target)
            throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Employee not found');
        if (!version || version.contractTemplateId !== dto.contractTemplateId)
            throw (0, error_util_1.notFound)('CONTRACT_TEMPLATE_VERSION_NOT_FOUND', 'Contract template version not found');
        if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate))
            throw (0, error_util_1.badRequest)('INVALID_CONTRACT_DATES', 'Contract end date must be after start date');
        const payload = await this.prisma.$transaction(async (tx) => {
            const contractCode = await this.prisma.nextSequenceCode(tx, 'contract_code_seq', 'CTR');
            const contract = await tx.employeeContract.create({
                data: {
                    contractCode,
                    userId: dto.userId,
                    contractTemplateId: dto.contractTemplateId,
                    contractTemplateVersionId: dto.contractTemplateVersionId,
                    contractType: dto.contractType,
                    title: dto.title,
                    startDate: new Date(dto.startDate),
                    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                    draftFileUrl: dto.draftFileUrl,
                    createdById: actor.userId,
                    positionSnapshot: target.profile?.position ? { id: target.profile.position.id, name: target.profile.position.name } : undefined,
                    departmentSnapshot: target.departmentLinks.map((link) => ({ id: link.departmentId, name: link.department.name, isPrimary: link.isPrimary })),
                },
                include: this.include(),
            });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'CONTRACT_CREATED', entityType: 'EmployeeContract', entityId: contract.id, metadata: { contractCode } } });
            return contract;
        });
        this.realtime.emitToUser(dto.userId, 'contract:updated', { id: payload.id, status: payload.status });
        return payload;
    }
    async findAll(actor, departmentId) {
        if (this.has(actor, 'contract.read_all'))
            return this.prisma.employeeContract.findMany({ include: this.include(), orderBy: { createdAt: 'desc' } });
        if (this.has(actor, 'contract.read_department')) {
            const ids = await this.departmentUserIds(actor, departmentId);
            return this.prisma.employeeContract.findMany({ where: { userId: { in: ids } }, include: this.include(), orderBy: { createdAt: 'desc' } });
        }
        return this.findMine(actor);
    }
    findMine(actor) {
        return this.prisma.employeeContract.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, actor) {
        const contract = await this.prisma.employeeContract.findUnique({ where: { id }, include: this.include() });
        if (!contract)
            throw (0, error_util_1.notFound)('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
        await this.assertCanReadContract(contract.userId, actor);
        return contract;
    }
    async updateContract(id, dto, actor) {
        const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
        if (!contract)
            throw (0, error_util_1.notFound)('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
        if (contract.status !== client_1.ContractStatus.DRAFT)
            throw (0, error_util_1.badRequest)('CONTRACT_NOT_EDITABLE', 'Only draft contract can be edited');
        await this.assertCanManageContract(contract.userId, actor);
        return this.prisma.employeeContract.update({
            where: { id },
            data: {
                title: dto.title,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                draftFileUrl: dto.draftFileUrl,
            },
            include: this.include(),
        });
    }
    submitApproval(id, actor) {
        return this.transition(id, actor, client_1.ContractStatus.DRAFT, client_1.ContractStatus.PENDING_INTERNAL_APPROVAL, 'CONTRACT_SUBMITTED', client_1.NotificationType.CONTRACT_APPROVAL_REQUIRED);
    }
    approve(id, actor) {
        return this.transition(id, actor, client_1.ContractStatus.PENDING_INTERNAL_APPROVAL, client_1.ContractStatus.APPROVED, 'CONTRACT_APPROVED', client_1.NotificationType.CONTRACT_APPROVED, {
            approvedById: actor.userId,
            approvedAt: new Date(),
        });
    }
    reject(id, actor, dto) {
        return this.transition(id, actor, client_1.ContractStatus.PENDING_INTERNAL_APPROVAL, client_1.ContractStatus.CANCELLED, 'CONTRACT_REJECTED', client_1.NotificationType.CONTRACT_APPROVED, {
            terminationReason: dto.reason,
        });
    }
    requestEmployeeSignature(id, actor) {
        return this.transition(id, actor, client_1.ContractStatus.APPROVED, client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE, 'CONTRACT_SIGNATURE_REQUESTED', client_1.NotificationType.CONTRACT_SIGNATURE_REQUIRED);
    }
    async signEmployee(id, dto, actor) {
        const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
        if (!contract)
            throw (0, error_util_1.notFound)('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
        if (contract.userId !== actor.userId)
            throw (0, error_util_1.forbidden)('CONTRACT_EMPLOYEE_SIGNATURE_DENIED', 'Employee can only sign own contract');
        return this.sign(id, dto, actor, client_1.ContractSignerRole.EMPLOYEE, client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE, client_1.ContractStatus.EMPLOYEE_SIGNED, 'CONTRACT_EMPLOYEE_SIGNED');
    }
    async signCompany(id, dto, actor) {
        return this.sign(id, dto, actor, client_1.ContractSignerRole.COMPANY, client_1.ContractStatus.WAITING_COMPANY_SIGNATURE, client_1.ContractStatus.COMPLETED, 'CONTRACT_COMPANY_SIGNED');
    }
    activate(id, actor) {
        return this.transition(id, actor, client_1.ContractStatus.COMPLETED, client_1.ContractStatus.ACTIVE, 'CONTRACT_ACTIVATED', client_1.NotificationType.CONTRACT_SIGNED, { effectiveAt: new Date() });
    }
    terminate(id, actor, dto) {
        return this.transition(id, actor, client_1.ContractStatus.ACTIVE, client_1.ContractStatus.TERMINATED, 'CONTRACT_TERMINATED', client_1.NotificationType.CONTRACT_TERMINATED, {
            terminatedAt: new Date(),
            terminationReason: dto.reason,
        });
    }
    expiry(days = 30) {
        const now = new Date();
        const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.prisma.employeeContract.findMany({
            where: { status: client_1.ContractStatus.ACTIVE, endDate: { gte: now, lte: until } },
            include: this.include(),
            orderBy: { endDate: 'asc' },
        });
    }
    async transition(id, actor, from, to, auditAction, notificationType, extra = {}) {
        this.policy.assertTransition(from, to);
        const current = await this.prisma.employeeContract.findUnique({ where: { id } });
        if (!current)
            throw (0, error_util_1.notFound)('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
        await this.assertCanManageContract(current.userId, actor);
        const payload = await this.prisma.$transaction(async (tx) => {
            const changed = await tx.employeeContract.updateMany({ where: { id, status: from }, data: { status: to, ...extra } });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('CONTRACT_STATE_CONFLICT', 'Contract state already changed');
            const contract = await tx.employeeContract.findUniqueOrThrow({ where: { id }, include: this.include() });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: auditAction, entityType: 'EmployeeContract', entityId: id, metadata: { from, to } } });
            const notification = await this.notifications.createForUsers(tx, [contract.userId], {
                type: notificationType,
                title: 'Contract updated',
                body: contract.title,
                metadata: { contractId: id, status: to },
            });
            return { contract, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(payload.contract.userId, to === client_1.ContractStatus.WAITING_EMPLOYEE_SIGNATURE ? 'contract:signature-required' : 'contract:updated', {
            id,
            status: to,
        });
        return payload.contract;
    }
    async sign(id, dto, actor, signerRole, expected, next, auditAction) {
        this.policy.assertTransition(expected, next);
        const payload = await this.prisma.$transaction(async (tx) => {
            const contract = await tx.employeeContract.findUnique({ where: { id } });
            if (!contract)
                throw (0, error_util_1.notFound)('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
            if (contract.status !== expected)
                throw (0, error_util_1.badRequest)('CONTRACT_SIGN_WRONG_STATE', 'Contract is not ready for this signature');
            if (signerRole === client_1.ContractSignerRole.COMPANY)
                this.policy.assertTransition(client_1.ContractStatus.EMPLOYEE_SIGNED, client_1.ContractStatus.WAITING_COMPANY_SIGNATURE);
            if (signerRole === client_1.ContractSignerRole.COMPANY && contract.status !== client_1.ContractStatus.WAITING_COMPANY_SIGNATURE)
                throw (0, error_util_1.badRequest)('CONTRACT_SIGN_WRONG_STATE', 'Contract is not ready for company signature');
            const signatureDataHash = dto.signatureData ? this.integrity.sha256(dto.signatureData) : undefined;
            const signedFileUrl = dto.signedFileUrl ?? contract.signedFileUrl ?? contract.draftFileUrl ?? contract.contractCode;
            const signedDocumentHash = this.integrity.hashDocumentReference(signedFileUrl, signatureDataHash);
            await tx.contractSignature.create({
                data: {
                    contractId: id,
                    signerUserId: actor.userId,
                    signerRole,
                    signatureType: dto.signatureType,
                    signatureImageUrl: dto.signatureImageUrl,
                    signatureDataHash,
                    signedDocumentHash,
                    ipAddress: dto.ipAddress,
                    deviceInfo: dto.deviceInfo,
                },
            });
            const changed = await tx.employeeContract.updateMany({
                where: { id, status: expected },
                data: signerRole === client_1.ContractSignerRole.EMPLOYEE
                    ? { status: next, employeeSignedAt: new Date() }
                    : { status: next, companySignedAt: new Date(), signedFileUrl },
            });
            if (changed.count !== 1)
                throw (0, error_util_1.conflict)('CONTRACT_STATE_CONFLICT', 'Contract state already changed');
            if (signerRole === client_1.ContractSignerRole.EMPLOYEE) {
                await tx.employeeContract.update({ where: { id }, data: { status: client_1.ContractStatus.WAITING_COMPANY_SIGNATURE } });
            }
            const updated = await tx.employeeContract.findUniqueOrThrow({ where: { id }, include: this.include() });
            await tx.auditLog.create({ data: { actorUserId: actor.userId, action: auditAction, entityType: 'EmployeeContract', entityId: id, metadata: { signerRole, signedDocumentHash } } });
            const notification = await this.notifications.createForUsers(tx, [updated.userId], {
                type: client_1.NotificationType.CONTRACT_SIGNED,
                title: 'Contract signed',
                body: updated.title,
                metadata: { contractId: id, signerRole },
            });
            return { updated, notification };
        });
        this.notifications.emitCreated(payload.notification);
        this.realtime.emitToUser(payload.updated.userId, 'contract:updated', { id, status: payload.updated.status });
        return payload.updated;
    }
    async assertCanReadContract(userId, actor) {
        if (userId === actor.userId && this.has(actor, 'contract.read_own'))
            return;
        if (this.has(actor, 'contract.read_all'))
            return;
        if (this.has(actor, 'contract.read_department')) {
            const departmentId = await this.scope.getPrimaryDepartmentId(userId);
            this.scope.assertDepartmentAccess(actor, departmentId);
            return;
        }
        throw (0, error_util_1.forbidden)('EMPLOYEE_CONTRACT_IDOR_DENIED', 'Cannot read this contract');
    }
    async assertCanManageContract(userId, actor) {
        if (this.has(actor, 'contract.read_all') || this.has(actor, 'contract.approve') || this.has(actor, 'contract.terminate'))
            return;
        if (this.has(actor, 'contract.read_department')) {
            const departmentId = await this.scope.getPrimaryDepartmentId(userId);
            this.scope.assertDepartmentAccess(actor, departmentId);
            return;
        }
        throw (0, error_util_1.forbidden)('CONTRACT_MANAGE_FORBIDDEN', 'Cannot manage this contract');
    }
    async departmentUserIds(actor, departmentId) {
        if (departmentId)
            this.scope.assertDepartmentAccess(actor, departmentId);
        const visible = departmentId ? [departmentId] : this.scope.visibleDepartmentIds(actor);
        const members = await this.prisma.departmentMember.findMany({ where: { departmentId: visible ? { in: visible } : undefined, leftAt: null }, select: { userId: true } });
        return members.map((member) => member.userId);
    }
    include() {
        return { user: { include: { profile: true } }, contractTemplate: true, contractTemplateVersion: true, signatures: true };
    }
    has(actor, permission) {
        return actor.permissions.includes(permission);
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        notifications_service_1.NotificationsService,
        realtime_events_service_1.RealtimeEventsService,
        contract_state_policy_service_1.ContractStatePolicy,
        document_integrity_service_1.DocumentIntegrityService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map