import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { NotificationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
import { ExpoPushService } from './expo-push.service';

function stripEmojis(str?: string): string {
  if (!str) return str || '';
  return str
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
    private readonly expoPush: ExpoPushService,
  ) {}

  async createForUsers(
    tx: Prisma.TransactionClient,
    userIds: string[],
    data: { type: NotificationType; title: string; body: string; taskId?: string; dedupKey?: string; metadata?: Prisma.InputJsonValue },
  ) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
    if (!uniqueUserIds.length) return null;
    const cleanTitle = stripEmojis(data.title);
    const cleanBody = stripEmojis(data.body);
    const notification = await tx.notification.create({
      data: {
        type: data.type,
        title: cleanTitle,
        body: cleanBody,
        taskId: data.taskId,
        dedupKey: data.dedupKey,
        metadata: data.metadata,
        targets: { create: uniqueUserIds.map((userId) => ({ userId })) },
        deliveries: { create: uniqueUserIds.map((userId) => ({ userId })) },
      },
    });
    return { notification, userIds: uniqueUserIds };
  }

  emitCreated(payload: Awaited<ReturnType<NotificationsService['createForUsers']>>): void {
    if (!payload) return;
    for (const userId of payload.userIds) {
      this.realtime.emitToUser(userId, 'notification.created', payload.notification);
    }
    
    // Also send push notification
    this.expoPush.sendPushNotification(
      payload.userIds,
      payload.notification.title,
      payload.notification.body,
      { 
        notificationId: payload.notification.id,
        type: payload.notification.type,
        taskId: payload.notification.taskId,
        metadata: payload.notification.metadata
      },
      { priority: 'high' }
    ).catch(e => this.logger.error('Failed to send push notification', e));
  }

  async findMine(actor: AuthenticatedUser, skip = 0, take = 20) {
    const targets = await this.prisma.notificationTarget.findMany({
      where: { userId: actor.userId },
      include: { notification: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    return targets.map((t) => ({
      ...t,
      notification: t.notification
        ? {
            ...t.notification,
            title: stripEmojis(t.notification.title),
            body: stripEmojis(t.notification.body),
          }
        : t.notification,
    }));
  }

  unreadCount(actor: AuthenticatedUser) {
    return this.prisma.notificationTarget.count({
      where: { userId: actor.userId, readAt: null },
    });
  }

  async markRead(id: string, actor: AuthenticatedUser) {
    const target = await this.prisma.notificationTarget.findFirst({
      where: { notificationId: id, userId: actor.userId },
    });
    if (!target) throw notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    return this.prisma.notificationTarget.update({
      where: { id: target.id },
      data: { readAt: target.readAt ?? new Date() },
      include: { notification: true },
    });
  }

  markAllRead(actor: AuthenticatedUser) {
    return this.prisma.notificationTarget.updateMany({
      where: { userId: actor.userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  registerDevice(dto: RegisterDeviceTokenDto, actor: AuthenticatedUser) {
    const tokenHash = this.hashToken(dto.token);
    return this.prisma.deviceToken.upsert({
      where: { tokenHash },
      update: {
        userId: actor.userId,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId,
        revokedAt: null,
        lastSeenAt: new Date(),
      },
      create: {
        userId: actor.userId,
        tokenHash,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId,
      },
    });
  }

  revokeDevice(id: string, actor: AuthenticatedUser) {
    return this.prisma.deviceToken.updateMany({
      where: { id, userId: actor.userId },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
