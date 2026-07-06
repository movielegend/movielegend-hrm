import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehouseScopeService } from './warehouse-scope.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WarehousesController],
  providers: [WarehousesService, WarehouseScopeService],
  exports: [WarehouseScopeService],
})
export class WarehouseModule {}
