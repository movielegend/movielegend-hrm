import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateInventoryCheckDto, UpdateInventoryCheckItemsDto } from './dto/inventory-check.dto';
import { InventoryChecksService } from './inventory-checks.service';

@ApiTags('Inventory Checks')
@ApiBearerAuth()
@Controller('inventory-checks')
export class InventoryChecksController {
  constructor(private readonly checks: InventoryChecksService) {}

  @Post()
  @Permissions('inventory_check.create')
  create(@Body() dto: CreateInventoryCheckDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.checks.create(dto, actor);
  }

  @Get()
  @Permissions('inventory_check.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.checks.findAll(actor);
  }

  @Get(':id')
  @Permissions('inventory_check.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.checks.findOne(id, actor);
  }

  @Patch(':id/items')
  @Permissions('inventory_check.submit')
  updateItems(@Param('id') id: string, @Body() dto: UpdateInventoryCheckItemsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.checks.updateItems(id, dto, actor);
  }

  @Post(':id/submit')
  @Permissions('inventory_check.submit')
  submit(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.checks.submit(id, actor);
  }

  @Post(':id/approve')
  @Permissions('inventory_check.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.checks.approve(id, actor);
  }
}
