import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePayrollPeriodDto, ImportPayrollDto, MyPayslipQueryDto, CompanyPayslipsQueryDto, UploadPayslipImageDto } from './dto/payroll.dto';
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
  payrolls(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.findPeriodPayrolls(id, actor);
  }
}

@ApiTags('Payrolls')
@ApiBearerAuth()
@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payroll: PayrollService) {}

  @Get('my')
  @AnyPermissions('payroll.read_own', 'payroll.read_all')
  myPayrolls(@CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.myPayrolls(actor);
  }

  @Get('my-payslip')
  @AnyPermissions('payroll.read_own', 'payroll.read_all')
  getMyPayslip(@CurrentUser() actor: AuthenticatedUser, @Query() query: MyPayslipQueryDto) {
    return this.payroll.getMyPayslip(actor, query);
  }

  @Get('company-payslips')
  @AnyPermissions(
    'payroll.read_all',
    'payroll.read',
    'payroll.read_own',
    'payroll.calculate',
    'payroll.review',
    'payroll.approve',
    'payroll.manage',
    'salary_profile.read',
    'salary_component.read',
    'report.payroll.summary',
    'report.payroll.detail',
    'attendance.read',
    'dashboard.department.read',
    'dashboard.admin.read',
  )
  getCompanyMonthlyPayslips(@CurrentUser() actor: AuthenticatedUser, @Query() query: CompanyPayslipsQueryDto) {
    return this.payroll.getCompanyMonthlyPayslips(actor, query);
  }

  @Post('import')
  @AnyPermissions(
    'payroll.calculate',
    'payroll.review',
    'payroll.approve',
    'payroll.manage',
    'payroll.read_all',
    'salary_profile.read',
  )
  importPayrolls(@Body() dto: ImportPayrollDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.importPayrolls(actor, dto);
  }

  @Post('upload-image')
  @AnyPermissions(
    'payroll.calculate',
    'payroll.review',
    'payroll.approve',
    'payroll.manage',
    'payroll.read_all',
    'payroll.read',
    'payroll.read_own',
    'salary_profile.read',
    'salary_component.read',
    'report.payroll.summary',
    'report.payroll.detail',
    'attendance.read',
    'dashboard.department.read',
    'dashboard.admin.read',
  )
  uploadPayslipImage(@Body() dto: UploadPayslipImageDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.uploadOfficialImage(actor, dto);
  }

  @Post('my/:id/acknowledge')
  @AnyPermissions('payroll.read_own', 'payroll.read_all')
  acknowledgePayslip(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.payroll.acknowledgePayslip(id, actor);
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
