import { Body, Controller, Get, Ip, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ContractsService } from './contracts.service';
import {
  CreateContractTemplateDto,
  CreateEmployeeContractDto,
  RejectContractDto,
  SignContractDto,
  TerminateContractDto,
  UpdateContractTemplateDto,
  UpdateTemplateMappingDto,
  UpdateEmployeeContractDto,
  ScanContractDto,
} from './dto/contract.dto';
import { AcknowledgeContractDto } from './dto/acknowledge-contract.dto';

@ApiTags('Contract Templates')
@ApiBearerAuth()
@Controller('contract-templates')
export class ContractTemplatesController {
  constructor(private readonly contracts: ContractsService) {}

  @Post()
  @Permissions('contract_template.create')
  create(@Body() dto: CreateContractTemplateDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.createTemplate(dto, actor);
  }

  @Get()
  @Permissions('contract_template.read')
  findAll() {
    return this.contracts.findTemplates();
  }

  @Get(':id')
  @Permissions('contract_template.read')
  findOne(@Param('id') id: string) {
    return this.contracts.findTemplate(id);
  }

  @Patch(':id')
  @Permissions('contract_template.update')
  update(@Param('id') id: string, @Body() dto: UpdateContractTemplateDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.updateTemplate(id, dto, actor);
  }

  @Patch(':id/mapping')
  @Permissions('contract_template.update')
  updateMapping(@Param('id') id: string, @Body() dto: UpdateTemplateMappingDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.updateTemplateMapping(id, dto, actor);
  }
}

@ApiTags('Employee Contracts')
@ApiBearerAuth()
@Controller('employee-contracts')
export class EmployeeContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Post()
  @Permissions('contract.create')
  create(@Body() dto: CreateEmployeeContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.createContract(dto, actor);
  }

  @Post('scan')
  @Permissions('contract.create')
  scanContract(@Body() dto: ScanContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.scanContract(dto, actor);
  }

  @Get()
  @AnyPermissions('contract.read_own', 'contract.read_department', 'contract.read_all')
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query('departmentId') departmentId?: string) {
    return this.contracts.findAll(actor, departmentId);
  }

  @Get('my')
  @Permissions('contract.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.findMine(actor);
  }

  @Get('expiry')
  @AnyPermissions('contract.read_department', 'contract.read_all')
  expiry(@Query('days') days?: string) {
    return this.contracts.expiry(days ? Number(days) : 30);
  }

  @Post(':id/acknowledge')
  @Permissions('contract.read_own')
  acknowledge(
    @Param('id') id: string,
    @Body() dto: AcknowledgeContractDto,
    @Ip() ipAddress: string,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.contracts.acknowledgeContract(id, dto, ipAddress, actor);
  }

  @Get(':id')
  @AnyPermissions('contract.read_own', 'contract.read_department', 'contract.read_all')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions('contract.create')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.updateContract(id, dto, actor);
  }

  @Post(':id/submit-approval')
  @Permissions('contract.create')
  submitApproval(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.submitApproval(id, actor);
  }

  @Post(':id/approve')
  @Permissions('contract.approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.approve(id, actor);
  }

  @Post(':id/reject')
  @Permissions('contract.approve')
  reject(@Param('id') id: string, @Body() dto: RejectContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.reject(id, actor, dto);
  }

  @Post(':id/request-employee-signature')
  @Permissions('contract.approve')
  requestEmployeeSignature(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.requestEmployeeSignature(id, actor);
  }

  @Post(':id/reject-signature')
  @Permissions('contract.read_own')
  rejectSignature(@Param('id') id: string, @Body() dto: RejectContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.employeeReject(id, actor, dto);
  }

  @Post(':id/sign/employee')
  @Permissions('contract.read_own')
  signEmployee(@Param('id') id: string, @Body() dto: SignContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.signEmployee(id, dto, actor);
  }

  @Post(':id/sign/company')
  @Permissions('contract.sign_company')
  signCompany(@Param('id') id: string, @Body() dto: SignContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.signCompany(id, dto, actor);
  }

  @Post(':id/activate')
  @Permissions('contract.approve')
  activate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.activate(id, actor);
  }

  @Post(':id/terminate')
  @Permissions('contract.terminate')
  terminate(@Param('id') id: string, @Body() dto: TerminateContractDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.contracts.terminate(id, actor, dto);
  }
}
