import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    findMine(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        notification: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
    unreadCount(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<number>;
    markRead(id: string, actor: AuthenticatedUser): Promise<{
        notification: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
    markAllRead(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    registerDevice(dto: RegisterDeviceTokenDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__DeviceTokenClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        platform: import("@prisma/client").$Enums.DevicePlatform;
        deviceId: string | null;
        tokenHash: string;
        lastSeenAt: Date;
        revokedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    revokeDevice(id: string, actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
}
