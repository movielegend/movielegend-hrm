import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StockModule } from '../stock/stock.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { InventoryChecksController } from './inventory-checks.controller';
import { InventoryChecksService } from './inventory-checks.service';

@Module({
  imports: [DatabaseModule, WarehouseModule, StockModule, RealtimeModule],
  controllers: [InventoryChecksController],
  providers: [InventoryChecksService],
})
export class InventoryChecksModule {}
