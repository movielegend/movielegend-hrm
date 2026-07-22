import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AssetsService } from './assets.service';
import {
  AssignAssetDto,
  CreateAssetDto,
  MaintenanceDto,
  ReceiveReturnDto,
  ReportIncidentDto,
  ResolveIncidentDto,
  TransferAssetDto,
  UpdateAssetDto,
  RevokeAssetDto,
} from './dto/asset.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller()
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post('assets')
  @Permissions('asset.create')
  create(@Body() dto: CreateAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.create(dto, actor);
  }

  @Get('assets')
  @Permissions('asset.read')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.assets.findAll(actor);
  }

  @Get('assets/my')
  @Permissions('asset.read')
  myAssets(@CurrentUser() actor: AuthenticatedUser) {
    return this.assets.myAssets(actor);
  }

  @Get('assets/:id')
  @Permissions('asset.read')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.findOne(id, actor);
  }

  @Patch('assets/:id')
  @Permissions('asset.create')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.update(id, dto, actor);
  }

  @Post('assets/:id/transfer')
  @Permissions('asset.create')
  transfer(@Param('id') id: string, @Body() dto: TransferAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.transfer(id, dto, actor);
  }

  @Post('assets/:id/assign')
  @Permissions('asset.assign')
  assign(@Param('id') id: string, @Body() dto: AssignAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.assign(id, dto, actor);
  }

  @Post('assets/:id/revoke')
  @Permissions('asset.assign')
  revoke(@Param('id') id: string, @Body() dto: RevokeAssetDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.revoke(id, dto, actor);
  }

  @Post('assets/:id/incidents')
  @Permissions('asset.incident.create')
  reportIncident(@Param('id') id: string, @Body() dto: ReportIncidentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.reportIncident(id, dto, actor);
  }

  @Post('assets/:id/maintenance')
  @Permissions('asset.maintenance.manage')
  startMaintenance(@Param('id') id: string, @Body() dto: MaintenanceDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.startMaintenance(id, dto, actor);
  }
}

@ApiTags('Asset Assignments')
@ApiBearerAuth()
@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(private readonly assets: AssetsService) {}

  @Post(':id/confirm')
  @Permissions('asset.return')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.confirmAssignment(id, actor);
  }

  @Post(':id/request-return')
  @Permissions('asset.return')
  requestReturn(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.requestReturn(id, actor);
  }

  @Post(':id/receive-return')
  @Permissions('asset.return')
  receiveReturn(@Param('id') id: string, @Body() dto: ReceiveReturnDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.receiveReturn(id, dto, actor);
  }
}

@ApiTags('Asset Incidents')
@ApiBearerAuth()
@Controller('asset-incidents')
export class AssetIncidentsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @Permissions('asset.incident.read')
  findAll() {
    return this.assets.findIncidents();
  }

  @Get(':id')
  @Permissions('asset.incident.read')
  findOne(@Param('id') id: string) {
    return this.assets.findIncident(id);
  }

  @Post(':id/investigate')
  @Permissions('asset.incident.resolve')
  investigate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.investigateIncident(id, actor);
  }

  @Post(':id/resolve')
  @Permissions('asset.incident.resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveIncidentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.resolveIncident(id, dto, actor);
  }

  @Post(':id/reject')
  @Permissions('asset.incident.resolve')
  reject(@Param('id') id: string, @Body() dto: ResolveIncidentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.rejectIncident(id, dto, actor);
  }
}

@ApiTags('Asset Maintenance')
@ApiBearerAuth()
@Controller('asset-maintenance')
export class AssetMaintenanceController {
  constructor(private readonly assets: AssetsService) {}

  @Post(':id/complete')
  @Permissions('asset.maintenance.manage')
  complete(@Param('id') id: string, @Body() dto: ReceiveReturnDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.assets.completeMaintenance(id, dto.conditionWhenReturned, actor);
  }
}
