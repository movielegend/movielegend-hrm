import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateMaterialIssueDto, CreateStockReceiptDto, CreateStockTransferDto, RejectDto } from './dto/stock.dto';
import { StockService } from './stock.service';

@ApiTags('Stock Receipts')
@ApiBearerAuth()
@Controller('stock-receipts')
export class StockReceiptsController {
  constructor(private readonly stock: StockService) {}

  @Post()
  @Permissions('stock.import')
  create(@Body() dto: CreateStockReceiptDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.createReceipt(dto, actor);
  }

  @Get()
  @Permissions('stock.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.stock.findReceipts(actor);
  }

  @Get(':id')
  @Permissions('stock.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.findReceipt(id, actor);
  }

  @Post(':id/approve')
  @Permissions('stock.import')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.approveReceipt(id, actor);
  }

  @Post(':id/cancel')
  @Permissions('stock.import')
  cancel(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.cancelReceipt(id, actor);
  }
}

@ApiTags('Material Issues')
@ApiBearerAuth()
@Controller('material-issues')
export class MaterialIssuesController {
  constructor(private readonly stock: StockService) {}

  @Post()
  @AnyPermissions('material_issue.create', 'stock.export')
  create(@Body() dto: CreateMaterialIssueDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.createIssue(dto, actor);
  }

  @Get()
  @Permissions('material_issue.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.stock.findIssues(actor);
  }

  @Get(':id')
  @Permissions('material_issue.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.findIssue(id, actor);
  }

  @Post(':id/approve')
  @Permissions('material_issue.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.approveIssue(id, actor);
  }

  @Post(':id/reject')
  @Permissions('material_issue.approve')
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.rejectIssue(id, dto, actor);
  }

  @Post(':id/issue')
  @Permissions('material_issue.issue')
  issue(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.issueMaterials(id, actor);
  }

  @Post(':id/cancel')
  @AnyPermissions('material_issue.create', 'material_issue.approve')
  cancel(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.cancelIssue(id, actor);
  }
}

@ApiTags('Stock Transfers')
@ApiBearerAuth()
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly stock: StockService) {}

  @Post()
  @Permissions('stock.transfer')
  create(@Body() dto: CreateStockTransferDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.createTransfer(dto, actor);
  }

  @Get()
  @Permissions('stock.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.stock.findTransfers(actor);
  }

  @Post(':id/approve')
  @Permissions('stock.transfer')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.approveTransfer(id, actor);
  }

  @Post(':id/ship')
  @Permissions('stock.transfer')
  ship(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.shipTransfer(id, actor);
  }

  @Post(':id/receive')
  @Permissions('stock.transfer')
  receive(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.receiveTransfer(id, actor);
  }

  @Post(':id/cancel')
  @Permissions('stock.transfer')
  cancel(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.stock.cancelTransfer(id, actor);
  }
}
