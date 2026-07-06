import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateKpiAssignmentDto, CreateKpiCriteriaDto, CreateKpiTemplateDto, UpdateKpiResultsDto, UpdateKpiTemplateDto } from './dto/kpi.dto';
import { KpiService } from './kpi.service';

@ApiTags('KPI Templates')
@ApiBearerAuth()
@Controller('kpi-templates')
export class KpiTemplatesController {
  constructor(private readonly kpi: KpiService) {}

  @Post()
  @Permissions('kpi_template.create')
  create(@Body() dto: CreateKpiTemplateDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.createTemplate(dto, actor);
  }

  @Get()
  @Permissions('kpi_template.read')
  findAll() {
    return this.kpi.findTemplates();
  }

  @Get(':id')
  @Permissions('kpi_template.read')
  findOne(@Param('id') id: string) {
    return this.kpi.findTemplate(id);
  }

  @Patch(':id')
  @Permissions('kpi_template.update')
  update(@Param('id') id: string, @Body() dto: UpdateKpiTemplateDto) {
    return this.kpi.updateTemplate(id, dto);
  }

  @Post(':id/criteria')
  @Permissions('kpi_template.update')
  addCriteria(@Param('id') id: string, @Body() dto: CreateKpiCriteriaDto) {
    return this.kpi.addCriteria(id, dto);
  }
}

@ApiTags('KPI Assignments')
@ApiBearerAuth()
@Controller('kpi-assignments')
export class KpiAssignmentsController {
  constructor(private readonly kpi: KpiService) {}

  @Post()
  @Permissions('kpi.assign')
  assign(@Body() dto: CreateKpiAssignmentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.assign(dto, actor);
  }

  @Get('my')
  @Permissions('kpi.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.findMine(actor);
  }

  @Get('department/:departmentId')
  @Permissions('kpi.read_department')
  findDepartment(@Param('departmentId') departmentId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.findDepartment(departmentId, actor);
  }

  @Get(':id')
  @AnyPermissions('kpi.read_own', 'kpi.read_department', 'kpi.read_all')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.findOne(id, actor);
  }

  @Patch(':id/results')
  @AnyPermissions('kpi.self_review', 'kpi.leader_review', 'kpi.finalize')
  updateResults(@Param('id') id: string, @Body() dto: UpdateKpiResultsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.updateResults(id, dto, actor);
  }

  @Post(':id/self-submit')
  @Permissions('kpi.self_review')
  selfSubmit(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.submitSelf(id, actor);
  }

  @Post(':id/leader-review')
  @Permissions('kpi.leader_review')
  leaderReview(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.leaderReview(id, actor);
  }

  @Post(':id/finalize')
  @Permissions('kpi.finalize')
  finalize(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.kpi.finalize(id, actor);
  }
}
