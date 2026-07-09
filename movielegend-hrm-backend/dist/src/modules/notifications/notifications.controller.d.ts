import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RegisterDeviceTokenDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    findMine(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<({
        notification: {
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            body: string;
            dedupKey: string | null;
            taskId: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        readAt: Date | null;
        notificationId: string;
    })[]>;
    unreadCount(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<number>;
    markRead(id: string, actor: AuthenticatedUser): Promise<{
        notification: {
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            body: string;
            dedupKey: string | null;
            taskId: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        readAt: Date | null;
        notificationId: string;
    }>;
    markAllRead(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    registerDevice(dto: RegisterDeviceTokenDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__DeviceTokenClient<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deviceId: string | null;
        tokenHash: string;
        revokedAt: Date | null;
        platform: import("@prisma/client").$Enums.DevicePlatform;
        lastSeenAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    revokeDevice(id: string, actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
}
