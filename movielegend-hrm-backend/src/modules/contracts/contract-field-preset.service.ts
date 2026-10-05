import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { conflict, notFound } from '../../common/utils/error.util';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateContractFieldPresetDto, UpdateContractFieldPresetDto } from './dto/contract-field-preset.dto';

@Injectable()
export class ContractFieldPresetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractFieldPresetDto, actor: AuthenticatedUser) {
    let companyId = dto.companyId;
    if (!companyId) {
      const company = await this.prisma.company.findFirst();
      if (!company) throw notFound('COMPANY_NOT_FOUND', 'Không tìm thấy công ty');
      companyId = company.id;
    }

    // Validate uniqueness manually due to PostgreSQL NULL != NULL
    const existing = await this.prisma.contractFieldPreset.findFirst({
      where: {
        contractTemplateId: dto.contractTemplateId,
        departmentId: dto.departmentId || null,
        positionId: dto.positionId || null,
      },
    });

    if (existing) {
      throw conflict('PRESET_EXISTS', 'Cấu hình preset này đã tồn tại.');
    }

    return this.prisma.contractFieldPreset.create({
      data: {
        ...dto,
        companyId,
        fieldDefaults: dto.fieldDefaults || {},
      },
    });
  }

  async findAll(templateId?: string, departmentId?: string) {
    return this.prisma.contractFieldPreset.findMany({
      where: {
        ...(templateId && { contractTemplateId: templateId }),
        ...(departmentId && { departmentId }),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, name: true, code: true } },
        contractTemplate: { select: { id: true, name: true, code: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const preset = await this.prisma.contractFieldPreset.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, name: true, code: true } },
      },
    });
    if (!preset) throw notFound('PRESET_NOT_FOUND', 'Không tìm thấy preset');
    return preset;
  }

  async update(id: string, dto: UpdateContractFieldPresetDto) {
    await this.findOne(id);
    return this.prisma.contractFieldPreset.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contractFieldPreset.delete({
      where: { id },
    });
  }

  async resolveForEmployee(templateId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { position: true } },
        departmentLinks: {
          where: { leftAt: null },
          include: { department: true, position: true },
        },
      },
    });
    if (!user) throw notFound('USER_NOT_FOUND', 'Không tìm thấy nhân viên');

    const primaryDeptLink = user.departmentLinks.find((link) => link.isPrimary) || user.departmentLinks[0];
    const departmentId = primaryDeptLink?.departmentId;
    const positionId = primaryDeptLink?.positionId || user.profile?.positionId;

    const orConditions: any[] = [{ departmentId: null, positionId: null }];
    if (departmentId) {
      orConditions.push({ departmentId, positionId: null });
      if (positionId) {
        orConditions.push({ departmentId, positionId });
      }
    }

    const presets = await this.prisma.contractFieldPreset.findMany({
      where: {
        contractTemplateId: templateId,
        isActive: true,
        OR: orConditions,
      },
    });

    let resolvedFields = {};
    const appliedPresets: any[] = [];

    // Apply from general to specific
    const companyWide = presets.find((p) => !p.departmentId && !p.positionId);
    if (companyWide) {
      resolvedFields = { ...resolvedFields, ...(companyWide.fieldDefaults as any) };
      appliedPresets.push(companyWide.name);
    }

    const deptWide = presets.find((p) => p.departmentId && !p.positionId);
    if (deptWide) {
      resolvedFields = { ...resolvedFields, ...(deptWide.fieldDefaults as any) };
      appliedPresets.push(deptWide.name);
    }

    const posSpecific = presets.find((p) => p.departmentId && p.positionId);
    if (posSpecific) {
      resolvedFields = { ...resolvedFields, ...(posSpecific.fieldDefaults as any) };
      appliedPresets.push(posSpecific.name);
    }

    const latestVersion = await this.prisma.contractTemplateVersion.findFirst({
      where: { contractTemplateId: templateId },
      orderBy: { versionNumber: 'desc' },
    });

    let requiredFields: any[] = [];
    if (latestVersion && latestVersion.mappingConfig) {
      const mappingConfig = latestVersion.mappingConfig as any[];
      requiredFields = mappingConfig.filter((f) => f.requiredBeforeSend);
    }

    let departmentName = primaryDeptLink?.department?.name || null;
    let positionName = primaryDeptLink?.position?.name || user.profile?.position?.name || null;
    if (!positionName && positionId) {
      const pos = await this.prisma.position.findUnique({ where: { id: positionId } });
      if (pos) positionName = pos.name;
    }

    return {
      resolvedFields,
      requiredFields,
      appliedPresets,
      departmentName,
      positionName,
    };
  }
}
