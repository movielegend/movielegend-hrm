import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { NotificationPreferencesService } from './notification-preferences.service';
export declare class NotificationPreferencesController {
    private readonly preferences;
    constructor(preferences: NotificationPreferencesService);
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
