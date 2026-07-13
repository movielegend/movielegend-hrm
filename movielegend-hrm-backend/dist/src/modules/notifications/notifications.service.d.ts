import { NotificationType, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
export declare class NotificationsService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeEventsService);
    createForUsers(tx: Prisma.TransactionClient, userIds: string[], data: {
        type: NotificationType;
        title: string;
        body: string;
        taskId?: string;
        dedupKey?: string;
        metadata?: Prisma.InputJsonValue;
    }): Promise<{
        notification: {
            id: string;
            createdAt: Date;
            title: string;
            type: import("@prisma/client").$Enums.NotificationType;
            metadata: Prisma.JsonValue | null;
            body: string;
            dedupKey: string | null;
            taskId: string | null;
        };
        userIds: string[];
    } | null>;
    emitCreated(payload: Awaited<ReturnType<NotificationsService['createForUsers']>>): void;
    findMine(actor: AuthenticatedUser): Prisma.PrismaPromise<({
        notification: {
            id: string;
            createdAt: Date;
            title: string;
            type: import("@prisma/client").$Enums.NotificationType;
            metadata: Prisma.JsonValue | null;
            body: string;
            dedupKey: string | null;
            taskId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        readAt: Date | null;
        notificationId: string;
    })[]>;
    unreadCount(actor: AuthenticatedUser): Prisma.PrismaPromise<number>;
    markRead(id: string, actor: AuthenticatedUser): Promise<{
        notification: {
            id: string;
            createdAt: Date;
            title: string;
            type: import("@prisma/client").$Enums.NotificationType;
            metadata: Prisma.JsonValue | null;
            body: string;
            dedupKey: string | null;
            taskId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        readAt: Date | null;
        notificationId: string;
    }>;
    markAllRead(actor: AuthenticatedUser): Prisma.PrismaPromise<Prisma.BatchPayload>;
    registerDevice(dto: RegisterDeviceTokenDto, actor: AuthenticatedUser): Prisma.Prisma__DeviceTokenClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        platform: import("@prisma/client").$Enums.DevicePlatform;
        deviceId: string | null;
        tokenHash: string;
        lastSeenAt: Date;
        revokedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    revokeDevice(id: string, actor: AuthenticatedUser): Prisma.PrismaPromise<Prisma.BatchPayload>;
    private hashToken;
}
