import { Module } from '@nestjs/common';
import { NewsfeedService } from './newsfeed.service';
import { NewsfeedController } from './newsfeed.controller';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, Phase2PolicyModule],
  controllers: [NewsfeedController],
  providers: [NewsfeedService]
})
export class NewsfeedModule {}
