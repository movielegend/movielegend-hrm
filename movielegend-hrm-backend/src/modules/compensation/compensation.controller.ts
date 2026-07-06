import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CompensationService } from './compensation.service';
import { CreateBonusDto, CreateDeductionDto, RejectCompensationDto } from './dto/compensation.dto';

@ApiTags('Bonuses')
@ApiBearerAuth()
@Controller('bonuses')
export class BonusesController {
  constructor(private readonly compensation: CompensationService) {}

  @Post()
  @Permissions('bonus.create')
  create(@Body() dto: CreateBonusDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.compensation.createBonus(dto, actor);
  }

  @Get()
  @Permissions('bonus.read')
  findAll() {
    return this.compensation.findBonuses();
  }

  @Post(':id/approve')
  @Permissions('bonus.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.compensation.approveBonus(id, actor);
  }

  @Post(':id/reject')
  @Permissions('bonus.approve')
  reject(@Param('id') id: string, @Body() dto: RejectCompensationDto) {
    return this.compensation.rejectBonus(id, dto);
  }

  @Post(':id/cancel')
  @Permissions('bonus.create')
  cancel(@Param('id') id: string) {
    return this.compensation.cancelBonus(id);
  }
}

@ApiTags('Deductions')
@ApiBearerAuth()
@Controller('deductions')
export class DeductionsController {
  constructor(private readonly compensation: CompensationService) {}

  @Post()
  @Permissions('deduction.create')
  create(@Body() dto: CreateDeductionDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.compensation.createDeduction(dto, actor);
  }

  @Get()
  @Permissions('deduction.read')
  findAll() {
    return this.compensation.findDeductions();
  }

  @Post(':id/approve')
  @Permissions('deduction.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.compensation.approveDeduction(id, actor);
  }

  @Post(':id/reject')
  @Permissions('deduction.approve')
  reject(@Param('id') id: string, @Body() dto: RejectCompensationDto) {
    return this.compensation.rejectDeduction(id, dto);
  }

  @Post(':id/cancel')
  @Permissions('deduction.create')
  cancel(@Param('id') id: string) {
    return this.compensation.cancelDeduction(id);
  }
}
