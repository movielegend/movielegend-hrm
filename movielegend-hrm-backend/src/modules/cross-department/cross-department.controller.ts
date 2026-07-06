import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CrossDepartmentService } from './cross-department.service';
import { CreateCrossDepartmentRequestDto, RejectCrossDepartmentRequestDto } from './dto/cross-department.dto';

@ApiTags('Cross Department')
@ApiBearerAuth()
@Controller('cross-department-requests')
export class CrossDepartmentController {
  constructor(private readonly requests: CrossDepartmentService) {}

  @Post()
  @Permissions('cross_department.create')
  create(@Body() dto: CreateCrossDepartmentRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.create(dto, actor);
  }

  @Get()
  @AnyPermissions('cross_department.create', 'cross_department.source_approve', 'cross_department.target_receive', 'cross_department.read_all')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.requests.findAll(actor);
  }

  @Get(':id')
  @AnyPermissions('cross_department.create', 'cross_department.source_approve', 'cross_department.target_receive', 'cross_department.read_all')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.findOne(id, actor);
  }

  @Patch(':id/source-approve')
  @Permissions('cross_department.source_approve')
  approveSource(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.approveSource(id, actor);
  }

  @Patch(':id/source-reject')
  @Permissions('cross_department.source_approve')
  rejectSource(@Param('id') id: string, @Body() dto: RejectCrossDepartmentRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.rejectSource(id, dto, actor);
  }

  @Patch(':id/target-accept')
  @Permissions('cross_department.target_receive')
  acceptTarget(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.acceptTarget(id, actor);
  }

  @Patch(':id/target-reject')
  @Permissions('cross_department.target_receive')
  rejectTarget(@Param('id') id: string, @Body() dto: RejectCrossDepartmentRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.requests.rejectTarget(id, dto, actor);
  }
}
