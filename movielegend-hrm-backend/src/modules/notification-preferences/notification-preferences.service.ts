import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';

const MANDATORY_TYPES = new Set<NotificationType>([
  NotificationType.PAYSLIP_AVAILABLE,
  NotificationType.CONTRACT_SIGNATURE_REQUIRED,
  NotificationType.DOCUMENT_REJECTED,
  NotificationType.KPI_FINALIZED,
]);

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(actor: AuthenticatedUser) {
    return this.prisma.userNotificationPreference.findMany({ where: { userId: actor.userId }, orderBy: { notificationType: 'asc' } });
  }

  updateMine(dto: UpdateNotificationPreferenceDto, actor: AuthenticatedUser) {
    if (MANDATORY_TYPES.has(dto.notificationType) && dto.inAppEnabled === false) {
      throw badRequest('MANDATORY_NOTIFICATION_CANNOT_DISABLE', 'Mandatory in-app notification cannot be disabled');
    }
    return this.prisma.userNotificationPreference.upsert({
      where: { userId_notificationType: { userId: actor.userId, notificationType: dto.notificationType } },
      update: {
        inAppEnabled: dto.inAppEnabled,
        pushEnabled: dto.pushEnabled,
        emailEnabled: dto.emailEnabled,
      },
      create: {
        userId: actor.userId,
        notificationType: dto.notificationType,
        inAppEnabled: dto.inAppEnabled ?? true,
        pushEnabled: dto.pushEnabled ?? true,
        emailEnabled: dto.emailEnabled ?? false,
      },
    });
  }
}
