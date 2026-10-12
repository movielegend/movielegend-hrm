import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { NotificationType, Prisma, TaskStatus } from '@prisma/client';
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
      { priority: 'high', channelId: 'default' }
    ).catch(e => this.logger.error('Failed to send push notification', e));
  }

  async findAccountantUserIds(prismaClient?: Prisma.TransactionClient | PrismaService): Promise<string[]> {
    const client = prismaClient || this.prisma;
    const accountantRoles = await client.role.findMany({
      where: {
        code: { in: ['ACCOUNTANT', 'ACCOUNTANT_LEAD', 'ACCOUNTANT_PAYROLL', 'ACCOUNTANT_TAX', 'ACCOUNTANT_GENERAL'] },
      },
      select: { id: true },
    });
    const roleIds = accountantRoles.map((r) => r.id);
    const userRoles = await client.userRole.findMany({
      where: { roleId: { in: roleIds } },
      select: { userId: true },
    });
    const deptMembers = await client.departmentMember.findMany({
      where: {
        department: {
          OR: [
            { name: { contains: 'KẾ TOÁN', mode: 'insensitive' } },
            { name: { contains: 'TÀI CHÍNH', mode: 'insensitive' } },
            { code: { in: ['KT', 'ACC', 'ACCOUNTING'] } },
          ],
        },
        leftAt: null,
      },
      select: { userId: true },
    });
    return [...new Set([...userRoles.map((ur) => ur.userId), ...deptMembers.map((dm) => dm.userId)])];
  }

  async notifyAccountantsOnHrEvent(
    tx: Prisma.TransactionClient,
    payload: {
      eventType: 'NEW_EMPLOYEE' | 'RESIGNED_EMPLOYEE' | 'SUSPENDED_EMPLOYEE' | 'ACTIVATED_EMPLOYEE' | 'DELETED_EMPLOYEE';
      employeeName: string;
      userCode: string;
      departmentName?: string;
      reason?: string;
      performedByName?: string;
    },
  ) {
    try {
      const accountantUserIds = await this.findAccountantUserIds(tx);
      if (!accountantUserIds.length) return;

      let title = '';
      let body = '';

      const deptInfo = payload.departmentName ? ` (${payload.departmentName})` : '';
      const actorInfo = payload.performedByName ? ` bởi ${payload.performedByName}` : '';

      switch (payload.eventType) {
        case 'NEW_EMPLOYEE':
          title = 'Biến động nhân sự: Tiếp nhận nhân viên mới 👤';
          body = `Nhân viên mới: ${payload.employeeName} - Mã NV: ${payload.userCode}${deptInfo} vừa được tiếp nhận vào hệ thống. Kế toán lưu ý cập nhật hồ sơ & bảng lương.`;
          break;
        case 'RESIGNED_EMPLOYEE':
          title = 'Biến động nhân sự: Nhân viên nghỉ việc 📋';
          body = `Nhân viên: ${payload.employeeName} - Mã NV: ${payload.userCode}${deptInfo} đã chuyển sang trạng thái Nghỉ việc.${payload.reason ? ` Lý do: ${payload.reason}.` : ''} Kế toán vui lòng kiểm tra công và quyết toán các khoản tồn đọng.`;
          break;
        case 'SUSPENDED_EMPLOYEE':
          title = 'Biến động nhân sự: Khóa tài khoản nhân viên 🔒';
          body = `Tài khoản của nhân viên: ${payload.employeeName} - Mã NV: ${payload.userCode}${deptInfo} đã bị tạm khóa${actorInfo}.${payload.reason ? ` Lý do: ${payload.reason}.` : ''}`;
          break;
        case 'ACTIVATED_EMPLOYEE':
          title = 'Biến động nhân sự: Kích hoạt / Mở khóa tài khoản 🔓';
          body = `Tài khoản của nhân viên: ${payload.employeeName} - Mã NV: ${payload.userCode}${deptInfo} đã được mở khóa và kích hoạt lại${actorInfo}.`;
          break;
        case 'DELETED_EMPLOYEE':
          title = 'Biến động nhân sự: Xóa nhân viên khỏi hệ thống ⚠️';
          body = `Nhân viên: ${payload.employeeName} - Mã NV: ${payload.userCode}${deptInfo} đã bị xóa/đặt lịch xóa khỏi hệ thống${actorInfo}.`;
          break;
      }

      const notif = await this.createForUsers(tx, accountantUserIds, {
        type: 'SYSTEM' as NotificationType,
        title,
        body,
        metadata: {
          category: 'HR_CHANGE',
          eventType: payload.eventType,
          userCode: payload.userCode,
          employeeName: payload.employeeName,
        },
      });

      if (notif) {
        this.emitCreated(notif);
      }
    } catch (err) {
      this.logger.error('Failed to notify accountants on HR event', err);
    }
  }

  async findMine(actor: AuthenticatedUser, skip = 0, take = 20) {
    const targets = await this.prisma.notificationTarget.findMany({
      where: {
        userId: actor.userId,
        notification: {
          OR: [
            { taskId: null },
            {
              task: {
                deletedAt: null,
                status: { not: TaskStatus.CANCELLED },
              },
            },
          ],
        },
      },
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
      where: {
        userId: actor.userId,
        readAt: null,
        notification: {
          OR: [
            { taskId: null },
            {
              task: {
                deletedAt: null,
                status: { not: TaskStatus.CANCELLED },
              },
            },
          ],
        },
      },
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

  async remove(id: string, actor: AuthenticatedUser) {
    const target = await this.prisma.notificationTarget.findFirst({
      where: {
        userId: actor.userId,
        OR: [
          { id },
          { notificationId: id },
        ],
      },
    });
    if (!target) throw notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    return this.prisma.notificationTarget.delete({
      where: { id: target.id },
    });
  }

  async removeAll(actor: AuthenticatedUser) {
    return this.prisma.notificationTarget.deleteMany({
      where: { userId: actor.userId },
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
