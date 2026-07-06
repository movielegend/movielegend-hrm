import { NotificationType } from '@prisma/client';
export declare class UpdateNotificationPreferenceDto {
    notificationType: NotificationType;
    inAppEnabled?: boolean;
    pushEnabled?: boolean;
    emailEnabled?: boolean;
}
