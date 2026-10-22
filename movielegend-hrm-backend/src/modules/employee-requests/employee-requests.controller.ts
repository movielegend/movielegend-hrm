import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { EmployeeRequestStatus } from '@prisma/client';
import {
  CreateEmployeeRequestDto,
  EmployeeRequestQueryDto,
  ApproveEmployeeRequestDto,
  RejectEmployeeRequestDto,
  ExportTransactionsQueryDto,
  ResubmitPurchaseByHrDto,
  FulfillPurchaseByHrDto,
  RequestCancelCompensatoryDto,
  DecideCancelCompensatoryDto,
} from './dto/employee-request.dto';
import { EmployeeRequestsService } from './employee-requests.service';

@ApiTags('Employee Requests')
@ApiBearerAuth()
@Controller('employee-requests')
export class EmployeeRequestsController {
  constructor(private readonly employeeRequestsService: EmployeeRequestsService) {}

  @AnyPermissions('employee.request', 'employee.request.approve')
  @Post()
  create(@Body() dto: CreateEmployeeRequestDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.create(dto, actor);
  }

  @AnyPermissions('employee.request.approve', 'employee.request.read')
  @Get()
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: EmployeeRequestStatus,
  ) {
    return this.employeeRequestsService.findAll(actor, departmentId, status);
  }

  @Permissions('employee.request.approve')
  @Get('export/daily-transactions')
  async exportDailyTransactions(
    @Query() query: ExportTransactionsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: any,
  ) {
    const result = await this.employeeRequestsService.exportDailyTransactions(query, actor);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(result.buffer);
  }

  @Permissions('employee.request.approve')
  @Post('import/payment-file')
  async importPaymentFile(
    @Body() body: { items?: any[]; fileBase64?: string; batchNote?: string },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    let fileBuffer: Buffer | null = null;
    if (body.fileBase64) {
      fileBuffer = Buffer.from(body.fileBase64, 'base64');
    }
    return this.employeeRequestsService.importPaymentFile(
      fileBuffer,
      body.items ? { items: body.items, batchNote: body.batchNote } : null,
      actor,
    );
  }

  @AnyPermissions('employee.request', 'employee.request.approve')
  @Get('my')
  findMine(@CurrentUser() actor: AuthenticatedUser, @Query() query: EmployeeRequestQueryDto) {
    return this.employeeRequestsService.findMine(actor, query);
  }

  @AnyPermissions('employee.request.approve', 'employee.request.read', 'employee.request')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.employeeRequestsService.findOne(id, actor);
  }

  @Permissions('employee.request.approve')
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body?: ApproveEmployeeRequestDto,
  ) {
    return this.employeeRequestsService.approve(id, actor, body);
  }

  @Permissions('employee.request.approve')
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body?: RejectEmployeeRequestDto,
  ) {
    return this.employeeRequestsService.reject(id, actor, body);
  }

  @Permissions('employee.request')
  @Post(':id/resubmit-by-hr')
  resubmitByHr(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: ResubmitPurchaseByHrDto,
  ) {
    return this.employeeRequestsService.resubmitPurchaseByHr(id, body, actor);
  }

  @Permissions('employee.request')
  @Post(':id/fulfill-purchase')
  fulfillPurchase(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: FulfillPurchaseByHrDto,
  ) {
    return this.employeeRequestsService.fulfillPurchaseByHr(id, body, actor);
  }

  @Permissions('employee.request')
  @Post(':id/create-expense-from-purchase')
  createExpenseFromPurchase(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.employeeRequestsService.createExpenseFromPurchase(id, body, actor);
  }

  @Permissions('employee.request')
  @Post(':id/request-cancel')
  requestCancelCompensatory(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: RequestCancelCompensatoryDto,
  ) {
    return this.employeeRequestsService.requestCancelCompensatory(id, actor, body);
  }

  @Permissions('employee.request.approve')
  @Post(':id/approve-cancel')
  approveCancelCompensatory(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body?: DecideCancelCompensatoryDto,
  ) {
    return this.employeeRequestsService.approveCancelCompensatory(id, actor, body);
  }

  @Permissions('employee.request.approve')
  @Post(':id/reject-cancel')
  rejectCancelCompensatory(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body?: DecideCancelCompensatoryDto,
  ) {
    return this.employeeRequestsService.rejectCancelCompensatory(id, actor, body);
  }
}
