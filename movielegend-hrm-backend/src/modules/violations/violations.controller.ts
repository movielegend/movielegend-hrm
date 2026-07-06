import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateDisciplinaryActionDto, CreateViolationDto } from './dto/violation.dto';
import { ViolationsService } from './violations.service';

@ApiTags('Violations', 'Disciplinary Actions')
@ApiBearerAuth()
@Controller('violations')
export class ViolationsController {
  constructor(private readonly violations: ViolationsService) {}

  @Post()
  @Permissions('violation.create')
  create(@Body() dto: CreateViolationDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.violations.create(dto, actor);
  }

  @Get()
  @Permissions('violation.read')
  findAll() {
    return this.violations.findAll();
  }

  @Get(':id')
  @Permissions('violation.read')
  findOne(@Param('id') id: string) {
    return this.violations.findOne(id);
  }

  @Post(':id/confirm')
  @Permissions('violation.confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.violations.confirm(id, actor);
  }

  @Post(':id/reject')
  @Permissions('violation.confirm')
  reject(@Param('id') id: string) {
    return this.violations.reject(id);
  }

  @Post(':id/disciplinary-actions')
  @Permissions('disciplinary_action.create')
  createAction(@Param('id') id: string, @Body() dto: CreateDisciplinaryActionDto) {
    return this.violations.createAction(id, dto);
  }

  @Post('disciplinary-actions/:id/approve')
  @Permissions('disciplinary_action.approve')
  approveAction(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.violations.approveAction(id, actor);
  }
}
