import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { AssetAssignmentsController, AssetIncidentsController, AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, WarehouseModule, NotificationsModule, RealtimeModule, StorageModule],
  controllers: [AssetsController, AssetAssignmentsController, AssetIncidentsController],
  providers: [AssetsService],
})
export class AssetsModule {}
