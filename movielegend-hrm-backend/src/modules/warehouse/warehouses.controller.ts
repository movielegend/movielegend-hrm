import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Post()
  @Permissions('warehouse.create')
  create(@Body() dto: CreateWarehouseDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.create(dto, actor);
  }

  @Get()
  @AnyPermissions('warehouse.read', 'warehouse.manage', 'stock.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.findAll(actor);
  }

  @Get(':id')
  @AnyPermissions('warehouse.read', 'warehouse.manage', 'stock.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions('warehouse.update')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.update(id, dto, actor);
  }

  @Delete(':id')
  @Permissions('warehouse.manage')
  close(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.close(id, actor);
  }

  @Get(':id/stocks')
  @Permissions('stock.read')
  stocks(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.warehouses.stocks(id, actor);
  }
}
