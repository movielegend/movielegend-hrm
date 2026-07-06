import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { forbidden } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { UpsertSystemSettingDto } from './dto/system-setting.dto';

const SECRET_KEY_PATTERN = /(secret|password|token|database_url|credential|private_key)/i;

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: AuthenticatedUser, companyId?: string) {
    const rows = await this.prisma.systemSetting.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    const canSeeSensitive = actor.roles.includes('ADMIN');
    return rows.map((row) => ({
      ...row,
      valueJson: row.isSensitive && !canSeeSensitive ? { masked: true } : row.valueJson,
    }));
  }

  upsert(dto: UpsertSystemSettingDto, actor: AuthenticatedUser) {
    if (SECRET_KEY_PATTERN.test(dto.key)) {
      throw forbidden('SECRET_SETTING_NOT_ALLOWED', 'Production secrets must stay in environment variables');
    }
    return this.prisma.systemSetting.upsert({
      where: { companyId_key: { companyId: dto.companyId, key: dto.key } },
      update: {
        valueJson: dto.valueJson as Prisma.InputJsonValue,
        category: dto.category,
        description: dto.description,
        isSensitive: dto.isSensitive ?? false,
        updatedById: actor.userId,
      },
      create: {
        companyId: dto.companyId,
        key: dto.key,
        valueJson: dto.valueJson as Prisma.InputJsonValue,
        category: dto.category,
        description: dto.description,
        isSensitive: dto.isSensitive ?? false,
        updatedById: actor.userId,
      },
    });
  }
}
