import { Injectable } from '@nestjs/common';
import { ContractSignerRole, ContractStatus, NotificationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { ContractStatePolicy } from './contract-state-policy.service';
import { DocumentIntegrityService } from './document-integrity.service';
import {
  CreateContractTemplateDto,
  CreateEmployeeContractDto,
  RejectContractDto,
  SignContractDto,
  TerminateContractDto,
  UpdateContractTemplateDto,
  UpdateEmployeeContractDto,
} from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
    private readonly policy: ContractStatePolicy,
    private readonly integrity: DocumentIntegrityService,
  ) {}

  async createTemplate(dto: CreateContractTemplateDto, actor: AuthenticatedUser) {
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

  async findTemplate(id: string) {
    const template = await this.prisma.contractTemplate.findUnique({ where: { id }, include: { versions: true } });
    if (!template || template.deletedAt) throw notFound('CONTRACT_TEMPLATE_NOT_FOUND', 'Contract template not found');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateContractTemplateDto, actor: AuthenticatedUser) {
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

  async createContract(dto: CreateEmployeeContractDto, actor: AuthenticatedUser) {
    const [target, version] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId }, include: { profile: { include: { position: true } }, departmentLinks: { where: { leftAt: null }, include: { department: true } } } }),
      this.prisma.contractTemplateVersion.findUnique({ where: { id: dto.contractTemplateVersionId }, include: { contractTemplate: true } }),
    ]);
    if (!target) throw notFound('USER_NOT_FOUND', 'Employee not found');
    if (!version || version.contractTemplateId !== dto.contractTemplateId) throw notFound('CONTRACT_TEMPLATE_VERSION_NOT_FOUND', 'Contract template version not found');
    if (dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) throw badRequest('INVALID_CONTRACT_DATES', 'Contract end date must be after start date');
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

  async findAll(actor: AuthenticatedUser, departmentId?: string) {
    if (this.has(actor, 'contract.read_all')) return this.prisma.employeeContract.findMany({ include: this.include(), orderBy: { createdAt: 'desc' } });
    if (this.has(actor, 'contract.read_department')) {
      const ids = await this.departmentUserIds(actor, departmentId);
      return this.prisma.employeeContract.findMany({ where: { userId: { in: ids } }, include: this.include(), orderBy: { createdAt: 'desc' } });
    }
    return this.findMine(actor);
  }

  findMine(actor: AuthenticatedUser) {
    return this.prisma.employeeContract.findMany({ where: { userId: actor.userId }, include: this.include(), orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id }, include: this.include() });
    if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
    await this.assertCanReadContract(contract.userId, actor);
    return contract;
  }

  async updateContract(id: string, dto: UpdateEmployeeContractDto, actor: AuthenticatedUser) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
    if (contract.status !== ContractStatus.DRAFT) throw badRequest('CONTRACT_NOT_EDITABLE', 'Only draft contract can be edited');
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

  submitApproval(id: string, actor: AuthenticatedUser) {
    return this.transition(id, actor, ContractStatus.DRAFT, ContractStatus.PENDING_INTERNAL_APPROVAL, 'CONTRACT_SUBMITTED', NotificationType.CONTRACT_APPROVAL_REQUIRED);
  }

  approve(id: string, actor: AuthenticatedUser) {
    return this.transition(id, actor, ContractStatus.PENDING_INTERNAL_APPROVAL, ContractStatus.APPROVED, 'CONTRACT_APPROVED', NotificationType.CONTRACT_APPROVED, {
      approvedById: actor.userId,
      approvedAt: new Date(),
    });
  }

  reject(id: string, actor: AuthenticatedUser, dto: RejectContractDto) {
    return this.transition(id, actor, ContractStatus.PENDING_INTERNAL_APPROVAL, ContractStatus.CANCELLED, 'CONTRACT_REJECTED', NotificationType.CONTRACT_APPROVED, {
      terminationReason: dto.reason,
    });
  }

  requestEmployeeSignature(id: string, actor: AuthenticatedUser) {
    return this.transition(id, actor, ContractStatus.APPROVED, ContractStatus.WAITING_EMPLOYEE_SIGNATURE, 'CONTRACT_SIGNATURE_REQUESTED', NotificationType.CONTRACT_SIGNATURE_REQUIRED);
  }

  async signEmployee(id: string, dto: SignContractDto, actor: AuthenticatedUser) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
    if (contract.userId !== actor.userId) throw forbidden('CONTRACT_EMPLOYEE_SIGNATURE_DENIED', 'Employee can only sign own contract');
    return this.sign(id, dto, actor, ContractSignerRole.EMPLOYEE, ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.EMPLOYEE_SIGNED, 'CONTRACT_EMPLOYEE_SIGNED');
  }

  async signCompany(id: string, dto: SignContractDto, actor: AuthenticatedUser) {
    return this.sign(id, dto, actor, ContractSignerRole.COMPANY, ContractStatus.WAITING_COMPANY_SIGNATURE, ContractStatus.COMPLETED, 'CONTRACT_COMPANY_SIGNED');
  }

  activate(id: string, actor: AuthenticatedUser) {
    return this.transition(id, actor, ContractStatus.COMPLETED, ContractStatus.ACTIVE, 'CONTRACT_ACTIVATED', NotificationType.CONTRACT_SIGNED, { effectiveAt: new Date() });
  }

  terminate(id: string, actor: AuthenticatedUser, dto: TerminateContractDto) {
    return this.transition(id, actor, ContractStatus.ACTIVE, ContractStatus.TERMINATED, 'CONTRACT_TERMINATED', NotificationType.CONTRACT_TERMINATED, {
      terminatedAt: new Date(),
      terminationReason: dto.reason,
    });
  }

  expiry(days = 30) {
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.employeeContract.findMany({
      where: { status: ContractStatus.ACTIVE, endDate: { gte: now, lte: until } },
      include: this.include(),
      orderBy: { endDate: 'asc' },
    });
  }

  private async transition(id: string, actor: AuthenticatedUser, from: ContractStatus, to: ContractStatus, auditAction: string, notificationType: NotificationType, extra: Record<string, unknown> = {}) {
    this.policy.assertTransition(from, to);
    const current = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!current) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
    await this.assertCanManageContract(current.userId, actor);
    const payload = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.employeeContract.updateMany({ where: { id, status: from }, data: { status: to, ...extra } });
      if (changed.count !== 1) throw conflict('CONTRACT_STATE_CONFLICT', 'Contract state already changed');
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
    this.realtime.emitToUser(payload.contract.userId, to === ContractStatus.WAITING_EMPLOYEE_SIGNATURE ? 'contract:signature-required' : 'contract:updated', {
      id,
      status: to,
    });
    return payload.contract;
  }

  private async sign(id: string, dto: SignContractDto, actor: AuthenticatedUser, signerRole: ContractSignerRole, expected: ContractStatus, next: ContractStatus, auditAction: string) {
    this.policy.assertTransition(expected, next);
    const payload = await this.prisma.$transaction(async (tx) => {
      const contract = await tx.employeeContract.findUnique({ where: { id } });
      if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
      if (contract.status !== expected) throw badRequest('CONTRACT_SIGN_WRONG_STATE', 'Contract is not ready for this signature');
      if (signerRole === ContractSignerRole.COMPANY) this.policy.assertTransition(ContractStatus.EMPLOYEE_SIGNED, ContractStatus.WAITING_COMPANY_SIGNATURE);
      if (signerRole === ContractSignerRole.COMPANY && contract.status !== ContractStatus.WAITING_COMPANY_SIGNATURE) throw badRequest('CONTRACT_SIGN_WRONG_STATE', 'Contract is not ready for company signature');
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
        data:
          signerRole === ContractSignerRole.EMPLOYEE
            ? { status: next, employeeSignedAt: new Date() }
            : { status: next, companySignedAt: new Date(), signedFileUrl },
      });
      if (changed.count !== 1) throw conflict('CONTRACT_STATE_CONFLICT', 'Contract state already changed');
      if (signerRole === ContractSignerRole.EMPLOYEE) {
        await tx.employeeContract.update({ where: { id }, data: { status: ContractStatus.WAITING_COMPANY_SIGNATURE } });
      }
      const updated = await tx.employeeContract.findUniqueOrThrow({ where: { id }, include: this.include() });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: auditAction, entityType: 'EmployeeContract', entityId: id, metadata: { signerRole, signedDocumentHash } } });
      const notification = await this.notifications.createForUsers(tx, [updated.userId], {
        type: NotificationType.CONTRACT_SIGNED,
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

  private async assertCanReadContract(userId: string, actor: AuthenticatedUser) {
    if (userId === actor.userId && this.has(actor, 'contract.read_own')) return;
    if (this.has(actor, 'contract.read_all')) return;
    if (this.has(actor, 'contract.read_department')) {
      const departmentId = await this.scope.getPrimaryDepartmentId(userId);
      this.scope.assertDepartmentAccess(actor, departmentId);
      return;
    }
    throw forbidden('EMPLOYEE_CONTRACT_IDOR_DENIED', 'Cannot read this contract');
  }

  private async assertCanManageContract(userId: string, actor: AuthenticatedUser) {
    if (this.has(actor, 'contract.read_all') || this.has(actor, 'contract.approve') || this.has(actor, 'contract.terminate')) return;
    if (this.has(actor, 'contract.read_department')) {
      const departmentId = await this.scope.getPrimaryDepartmentId(userId);
      this.scope.assertDepartmentAccess(actor, departmentId);
      return;
    }
    throw forbidden('CONTRACT_MANAGE_FORBIDDEN', 'Cannot manage this contract');
  }

  private async departmentUserIds(actor: AuthenticatedUser, departmentId?: string) {
    if (departmentId) this.scope.assertDepartmentAccess(actor, departmentId);
    const visible = departmentId ? [departmentId] : this.scope.visibleDepartmentIds(actor);
    const members = await this.prisma.departmentMember.findMany({ where: { departmentId: visible ? { in: visible } : undefined, leftAt: null }, select: { userId: true } });
    return members.map((member) => member.userId);
  }

  private include() {
    return { user: { include: { profile: true } }, contractTemplate: true, contractTemplateVersion: true, signatures: true } as const;
  }

  private has(actor: AuthenticatedUser, permission: string) {
    return actor.permissions.includes(permission);
  }
}
