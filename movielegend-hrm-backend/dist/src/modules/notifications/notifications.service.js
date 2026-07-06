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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let NotificationsService = class NotificationsService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async createForUsers(tx, userIds, data) {
        const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
        if (!uniqueUserIds.length)
            return null;
        const notification = await tx.notification.create({
            data: {
                type: data.type,
                title: data.title,
                body: data.body,
                taskId: data.taskId,
                dedupKey: data.dedupKey,
                metadata: data.metadata,
                targets: { create: uniqueUserIds.map((userId) => ({ userId })) },
                deliveries: { create: uniqueUserIds.map((userId) => ({ userId })) },
            },
        });
        return { notification, userIds: uniqueUserIds };
    }
    emitCreated(payload) {
        if (!payload)
            return;
        for (const userId of payload.userIds) {
            this.realtime.emitToUser(userId, 'notification.created', payload.notification);
        }
    }
    findMine(actor) {
        return this.prisma.notificationTarget.findMany({
            where: { userId: actor.userId },
            include: { notification: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    unreadCount(actor) {
        return this.prisma.notificationTarget.count({
            where: { userId: actor.userId, readAt: null },
        });
    }
    async markRead(id, actor) {
        const target = await this.prisma.notificationTarget.findFirst({
            where: { notificationId: id, userId: actor.userId },
        });
        if (!target)
            throw (0, error_util_1.notFound)('NOTIFICATION_NOT_FOUND', 'Notification not found');
        return this.prisma.notificationTarget.update({
            where: { id: target.id },
            data: { readAt: target.readAt ?? new Date() },
            include: { notification: true },
        });
    }
    markAllRead(actor) {
        return this.prisma.notificationTarget.updateMany({
            where: { userId: actor.userId, readAt: null },
            data: { readAt: new Date() },
        });
    }
    registerDevice(dto, actor) {
        const tokenHash = this.hashToken(dto.token);
        return this.prisma.deviceToken.upsert({
            where: { tokenHash },
            update: {
                userId: actor.userId,
                platform: dto.platform,
                deviceId: dto.deviceId,
                revokedAt: null,
                lastSeenAt: new Date(),
            },
            create: {
                userId: actor.userId,
                tokenHash,
                platform: dto.platform,
                deviceId: dto.deviceId,
            },
        });
    }
    revokeDevice(id, actor) {
        return this.prisma.deviceToken.updateMany({
            where: { id, userId: actor.userId },
            data: { revokedAt: new Date() },
        });
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_events_service_1.RealtimeEventsService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map