import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePayrollPeriodDto } from './dto/payroll.dto';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll Periods')
@ApiBearerAuth()
@Controller('payroll-periods')
export class PayrollPeriodsController {
  constructor(private readonly payroll: PayrollService) {}

  @Post()
  @Permissions('payroll_period.create')
  create(@Body() dto: CreatePayrollPeriodDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.createPeriod(dto, actor);
  }

  @Get()
  @Permissions('payroll_period.read')
  findAll() {
    return this.payroll.findPeriods();
  }

  @Get(':id')
  @Permissions('payroll_period.read')
  findOne(@Param('id') id: string) {
    return this.payroll.findPeriod(id);
  }

  @Post(':id/calculate')
  @Permissions('payroll.calculate')
  calculate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.calculatePeriod(id, actor);
  }

  @Post(':id/recalculate')
  @Permissions('payroll.calculate')
  recalculate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.recalculatePeriod(id, actor);
  }

  @Post(':id/submit-review')
  @Permissions('payroll.review')
  submitReview(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.submitReview(id, actor);
  }

  @Post(':id/approve')
  @Permissions('payroll.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.approve(id, actor);
  }

  @Post(':id/lock')
  @Permissions('payroll.lock')
  lock(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.lock(id, actor);
  }

  @Get(':id/payrolls')
  @Permissions('payroll.read_all')
  payrolls(@Param('id') id: string) {
    return this.payroll.findPeriodPayrolls(id);
  }
}

@ApiTags('Payrolls')
@ApiBearerAuth()
@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payroll: PayrollService) {}

  @Get('my')
  @Permissions('payroll.read_own')
  myPayrolls(@CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.myPayrolls(actor);
  }

  @Get('my/:id')
  @Permissions('payroll.read_own')
  myPayroll(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.myPayroll(id, actor);
  }

  @Get(':id')
  @Permissions('payroll.read_all')
  findOne(@Param('id') id: string) {
    return this.payroll.findPayroll(id);
  }
}
