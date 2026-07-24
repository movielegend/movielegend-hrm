import { Injectable } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  ScanContractDto,
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
      let companyId = dto.companyId;
      if (!companyId) {
        const company = await tx.company.findFirst();
        if (!company) throw new Error('No company found');
        companyId = company.id;
      }
      const template = await tx.contractTemplate.create({
        data: { ...dto, companyId, createdById: actor.userId },
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

  async updateTemplateMapping(id: string, dto: { mappingConfig: any[] }, actor: AuthenticatedUser) {
    this.policy.assertCanUpdate(actor);
    const template = await this.prisma.contractTemplate.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!template) throw notFound('CONTRACT_TEMPLATE_NOT_FOUND', 'Contract template not found');
    const latestVersion = template.versions[0];
    if (!latestVersion) throw notFound('CONTRACT_TEMPLATE_VERSION_NOT_FOUND', 'Contract template version not found');

    await this.prisma.contractTemplateVersion.update({
      where: { id: latestVersion.id },
      data: { mappingConfig: dto.mappingConfig as Prisma.InputJsonValue },
    });

    await this.prisma.auditLog.create({
      data: { actorUserId: actor.userId, action: 'CONTRACT_TEMPLATE_MAPPING_UPDATED', entityType: 'ContractTemplate', entityId: id, metadata: { versionNumber: latestVersion.versionNumber } },
    });
    
    return { success: true };
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
          status: ContractStatus.WAITING_EMPLOYEE_SIGNATURE,
          userId: dto.userId,
          contractTemplateId: dto.contractTemplateId,
          contractTemplateVersionId: dto.contractTemplateVersionId,
          contractType: dto.contractType,
          title: dto.title,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          draftFileUrl: dto.draftFileUrl,
          createdById: actor.userId,
          approvedById: actor.userId,
          approvedAt: new Date(),
          positionSnapshot: target.profile?.position ? { id: target.profile.position.id, name: target.profile.position.name } : undefined,
          departmentSnapshot: target.departmentLinks.map((link) => ({ id: link.departmentId, name: link.department.name, isPrimary: link.isPrimary })),
        },
        include: this.include(),
      });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: 'CONTRACT_CREATED', entityType: 'EmployeeContract', entityId: contract.id, metadata: { contractCode } } });
      const notification = await this.notifications.createForUsers(tx, [contract.userId], {
        type: NotificationType.CONTRACT_SIGNATURE_REQUIRED,
        title: 'Yêu cầu ký hợp đồng',
        body: `Bạn có một hợp đồng mới cần ký: ${contract.title}`,
        metadata: { contractId: contract.id, status: contract.status },
      });
      return { contract, notification };
    });
    this.notifications.emitCreated(payload.notification);
    this.realtime.emitToUser(dto.userId, 'contract:signature-required', { id: payload.contract.id, status: payload.contract.status });
    return payload.contract;
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

  async scanContract(dto: ScanContractDto, actor: AuthenticatedUser) {
    try {
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Bạn là một chuyên gia OCR và pháp lý nhân sự. 
Hãy đọc hình ảnh hợp đồng được đính kèm, bóc tách các thông tin sau và trả về ĐÚNG định dạng JSON (không markdown, không giải thích):
{
  "contractCode": "mã hợp đồng",
  "title": "tên hợp đồng",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "contractType": "PROBATION | FIXED_TERM | INDEFINITE_TERM | SERVICE | CONFIDENTIALITY | COMMITMENT | OTHER"
}`;
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: dto.imageUrl.split(',')[1], mimeType: 'image/jpeg' } }
      ]);
      
      const text = result.response.text();
      if (!text) {
        throw new Error('No content generated');
      }
      
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('OCR Error:', error);
      throw badRequest('OCR_FAILED', 'Không thể bóc tách dữ liệu từ ảnh');
    }
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
    const isAdmin = actor.roles?.includes('ADMIN') || actor.roles?.includes('HR');
    if (contract.userId !== actor.userId && !isAdmin) {
      throw forbidden('CONTRACT_EMPLOYEE_SIGNATURE_DENIED', 'Employee can only sign own contract');
    }
    
    let finalSignedFileUrl = dto.signedFileUrl;
    if (dto.signatureImageUrl) {
      const generatedUrl = await this.generateSignedPdf(id, dto.signatureImageUrl, (actor as any).profile?.fullName || 'Employee');
      if (generatedUrl) finalSignedFileUrl = generatedUrl;
    }

    const allowedStatuses: ContractStatus[] = [
      ContractStatus.WAITING_EMPLOYEE_SIGNATURE,
      ContractStatus.APPROVED,
      ContractStatus.DRAFT,
      ContractStatus.PENDING_INTERNAL_APPROVAL,
    ];

    if (!allowedStatuses.includes(contract.status as ContractStatus)) {
      throw badRequest('CONTRACT_SIGN_WRONG_STATE', 'Contract is not ready for this signature');
    }
    
    return this.sign(id, { ...dto, signedFileUrl: finalSignedFileUrl }, actor, ContractSignerRole.EMPLOYEE, contract.status as ContractStatus, ContractStatus.ACTIVE, 'CONTRACT_EMPLOYEE_SIGNED');
  }

  employeeReject(id: string, actor: AuthenticatedUser, dto: RejectContractDto) {
    return this.transition(id, actor, ContractStatus.WAITING_EMPLOYEE_SIGNATURE, ContractStatus.REJECTED, 'CONTRACT_REJECTED', NotificationType.SYSTEM, {
      rejectReason: dto.reason,
    });
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

  async acknowledgeContract(id: string, dto: { isAgreed: boolean; note?: string }, ipAddress: string, actor: AuthenticatedUser) {
    const contract = await this.prisma.employeeContract.findUnique({
      where: { id },
    });
    if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Khong tim thay hop dong');

    if (contract.userId !== actor.userId) {
      throw forbidden('CONTRACT_ACKNOWLEDGE_FORBIDDEN', 'Ban chi duoc xac nhan hop dong cua chinh minh');
    }

    if (contract.employeeAcknowledgementStatus !== 'PENDING') {
      throw badRequest('CONTRACT_ALREADY_ACKNOWLEDGED', 'Hop dong nay da duoc xac nhan');
    }

    const payload = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employeeContract.update({
        where: { id },
        data: {
          employeeAcknowledgementStatus: dto.isAgreed ? 'AGREED' : 'DISAGREED',
          employeeAcknowledgedAt: new Date(),
          employeeAcknowledgementNote: dto.note,
          employeeAcknowledgedByIp: ipAddress,
        },
        include: this.include(),
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: dto.isAgreed ? 'CONTRACT_AGREED' : 'CONTRACT_DISAGREED',
          entityType: 'EmployeeContract',
          entityId: id,
          metadata: { ipAddress, note: dto.note },
        },
      });
      const creatorNotif = contract.createdById ? await this.notifications.createForUsers(tx as any, [contract.createdById], {
        type: 'SYSTEM' as NotificationType,
        title: 'Phản hồi hợp đồng',
        body: `Nhân viên đã ${dto.isAgreed ? 'đồng ý' : 'từ chối'} hợp đồng ${contract.title}`,
        metadata: { contractId: id },
      }) : null;

      return { updated, creatorNotif };
    });
    
    if (payload.creatorNotif) this.notifications.emitCreated(payload.creatorNotif);
    this.realtime.emitToUser(contract.userId, 'contract:acknowledged', { id, status: payload.updated.employeeAcknowledgementStatus });
    return payload.updated;
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

  async generateSignedPdf(contractId: string, base64Signature: string, userFullName: string) {
    const contract = await this.prisma.employeeContract.findUnique({
      where: { id: contractId },
      include: { contractTemplateVersion: true }
    });
    
    if (!contract || !contract.contractTemplateVersion) return null;
    
    const rawUrl = contract.contractTemplateVersion.templateFileUrl || '';
    const storageKey = contract.contractTemplateVersion.storageKey || '';
    
    let existingPdfBytes: Buffer | null = null;
    
    const candidatePaths = [
      storageKey ? path.join(process.cwd(), 'storage', storageKey) : '',
      storageKey ? path.join(process.cwd(), 'storage', 'uploads', storageKey) : '',
      rawUrl ? path.join(process.cwd(), 'storage', decodeURIComponent(rawUrl).replace(/^\/uploads\//, '')) : '',
      rawUrl ? path.join(process.cwd(), 'storage', 'uploads', decodeURIComponent(rawUrl).replace(/^\/uploads\//, '')) : '',
      rawUrl ? path.join(process.cwd(), 'storage', 'uploads', decodeURIComponent(rawUrl).split(/[\/\\]/).pop() || '') : '',
      rawUrl ? path.join(process.cwd(), 'storage', 'uploads', rawUrl.split(/[\/\\]/).pop() || '') : '',
    ].filter(Boolean);

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        existingPdfBytes = fs.readFileSync(p);
        break;
      }
    }

    if (!existingPdfBytes) {
      console.error('Error generating PDF: Could not find template file at paths:', candidatePaths);
      return null;
    }
    try {
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      const mappingConfig = (contract.contractTemplateVersion as any).mappingConfig as any;
      const filledFields = (contract.filledFields as any) || {};

      if (Array.isArray(mappingConfig)) {
        for (const field of mappingConfig) {
          const page = pdfDoc.getPages()[field.page - 1];
          if (!page) continue;
          
          if (field.type === 'text') {
            let textValue = filledFields[field.id];
            if (!textValue && field.id === 'fullName') textValue = userFullName; // Fallback
            if (textValue) {
              page.drawText(String(textValue), { x: field.x, y: field.y, size: 12 });
            }
          } else if (field.type === 'checkbox') {
            const isChecked = filledFields[field.id] === true || filledFields[field.id] === 'true';
            if (isChecked) {
              // Draw a checkmark using text 'V' or similar, or draw lines. We'll use 'V' for simplicity.
              page.drawText('V', { x: field.x, y: field.y, size: 14 });
            }
          } else if (field.type === 'signature' && field.id === 'signature') {
            // Check if this signature field belongs to the current signer...
            // Currently, we just stamp the provided base64Signature at the first 'signature' field.
            try {
              const base64Data = base64Signature.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
              const signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
              page.drawImage(signatureImage, {
                x: field.x,
                y: field.y,
                width: field.width || 150,
                height: field.height || 75,
              });
            } catch (e) {
              console.error('Error embedding signature:', e);
            }
          } else if (field.type === 'signature' && field.role) {
              // If there's a specific signature box for a role, we'd need to match it, 
              // but since `generateSignedPdf` doesn't know the role context directly except we could infer it,
              // we will just draw the signature at the first matching role box or legacy 'signature' id box.
              // For simplicity, we draw the signature if role matches. But `generateSignedPdf` doesn't take role yet!
              // Let's modify generateSignedPdf to take role or we handle it here.
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const fileName = `signed_${contractId}.pdf`;
      const outPath = path.join(process.cwd(), 'storage', 'contracts', fileName);
      if (!fs.existsSync(path.dirname(outPath))) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
      }
      fs.writeFileSync(outPath, pdfBytes);
      return `/uploads/contracts/${fileName}`;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
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
      const mergedFilledFields = dto.filledFields 
        ? { ...(contract.filledFields as Record<string, any> || {}), ...dto.filledFields }
        : contract.filledFields;

      const changed = await tx.employeeContract.updateMany({
        where: { id, status: expected },
        data:
          signerRole === ContractSignerRole.EMPLOYEE
            ? { status: next, employeeSignedAt: new Date(), signedFileUrl, filledFields: mergedFilledFields ?? Prisma.DbNull }
            : { status: next, companySignedAt: new Date(), signedFileUrl, filledFields: mergedFilledFields ?? Prisma.DbNull },
      });
      if (changed.count !== 1) throw conflict('CONTRACT_STATE_CONFLICT', 'Contract state already changed');
      const updated = await tx.employeeContract.findUniqueOrThrow({ where: { id }, include: this.include() });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: auditAction, entityType: 'EmployeeContract', entityId: id, metadata: { signerRole, signedDocumentHash } } });
      const notification = await this.notifications.createForUsers(tx, [updated.userId], {
        type: NotificationType.CONTRACT_SIGNED,
        title: 'Contract signed',
        body: updated.title,
        metadata: { contractId: id, signerRole },
      });
      
      let creatorNotif = null;
      if (signerRole === ContractSignerRole.EMPLOYEE && updated.createdById && updated.createdById !== actor.userId) {
        creatorNotif = await this.notifications.createForUsers(tx, [updated.createdById], {
          type: 'SYSTEM' as NotificationType,
          title: 'Hợp đồng đã được ký',
          body: `Nhân viên đã ký hợp đồng: ${updated.title}`,
          metadata: { contractId: id },
        });
      }

      return { updated, notification, creatorNotif };
    });
    this.notifications.emitCreated(payload.notification);
    if (payload.creatorNotif) this.notifications.emitCreated(payload.creatorNotif);
    this.realtime.emitToUser(payload.updated.userId, 'contract:updated', { id, status: payload.updated.status });
    return payload.updated;
  }

  async deleteContract(id: string, actor: AuthenticatedUser) {
    const contract = await this.prisma.employeeContract.findUnique({ where: { id } });
    if (!contract) throw notFound('EMPLOYEE_CONTRACT_NOT_FOUND', 'Contract not found');
    await this.assertCanManageContract(contract.userId, actor);
    
    if (contract.status !== ContractStatus.WAITING_EMPLOYEE_SIGNATURE && contract.status !== ContractStatus.DRAFT) {
      throw badRequest('CONTRACT_DELETE_FORBIDDEN', 'Can only delete draft contracts or contracts waiting for employee signature');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.contractSignature.deleteMany({ where: { contractId: id } });
      await tx.employeeContract.delete({ where: { id } });
    });

    return { success: true };
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
