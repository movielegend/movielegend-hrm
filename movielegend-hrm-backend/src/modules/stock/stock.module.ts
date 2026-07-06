import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { MaterialIssuesController, StockReceiptsController, StockTransfersController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [DatabaseModule, WarehouseModule, Phase2PolicyModule, NotificationsModule, RealtimeModule],
  controllers: [StockReceiptsController, MaterialIssuesController, StockTransfersController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
