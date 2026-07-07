import { Body, Controller, Get, Ip, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateDocumentTypeDto, CreateEmployeeDocumentDto, UpdateDocumentTypeDto, VerifyEmployeeDocumentDto } from './dto/employee-document.dto';
import { EmployeeDocumentsService } from './employee-documents.service';
import { AcknowledgeDocumentDto } from './dto/acknowledge-document.dto';

@ApiTags('Document Types')
@ApiBearerAuth()
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documents: EmployeeDocumentsService) {}

  @Post()
  @Permissions('employee_document.verify')
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documents.createType(dto);
  }

  @Get()
  @AnyPermissions('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all')
  findAll(@Query('companyId') companyId?: string) {
    return this.documents.findTypes(companyId);
  }

  @Patch(':id')
  @Permissions('employee_document.verify')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentTypeDto) {
    return this.documents.updateType(id, dto);
  }
}

@ApiTags('Employee Documents')
@ApiBearerAuth()
@Controller('employee-documents')
export class EmployeeDocumentsController {
  constructor(private readonly documents: EmployeeDocumentsService) {}

  @Post()
  @Permissions('employee_document.create')
  create(@Body() dto: CreateEmployeeDocumentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.create(dto, actor);
  }

  @Get()
  @AnyPermissions('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all')
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query('departmentId') departmentId?: string) {
    return this.documents.findAll(actor, departmentId);
  }

  @Get('my')
  @Permissions('employee_document.read_own')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.documents.findMine(actor);
  }

  @Get('expiring')
  @AnyPermissions('employee_document.read_department', 'employee_document.read_all')
  expiring(@Query('days') days?: string) {
    return this.documents.expiring(days ? Number(days) : 30);
  }

  @Post(':id/acknowledge')
  @Permissions('employee_document.read_own')
  acknowledge(
    @Param('id') id: string,
    @Body() dto: AcknowledgeDocumentDto,
    @Ip() ipAddress: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.acknowledge(id, dto, ipAddress, actor);
  }

  @Get(':id')
  @AnyPermissions('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.findOne(id, actor);
  }

  @Post(':id/verify')
  @Permissions('employee_document.verify')
  verify(@Param('id') id: string, @Body() dto: VerifyEmployeeDocumentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.verify(id, dto, actor);
  }
}
