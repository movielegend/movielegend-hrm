import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
export declare class NotificationPreferencesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMine(actor: AuthenticatedUser): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notificationType: import("@prisma/client").$Enums.NotificationType;
        inAppEnabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
    }[]>;
    updateMine(dto: UpdateNotificationPreferenceDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__UserNotificationPreferenceClient<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notificationType: import("@prisma/client").$Enums.NotificationType;
        inAppEnabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
