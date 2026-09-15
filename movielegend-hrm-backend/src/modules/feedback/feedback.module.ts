import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
    imports: [NotificationsModule, Phase2PolicyModule],
    controllers: [FeedbackController],
    providers: [FeedbackService],
    exports: [FeedbackService],
})
export class FeedbackModule { }