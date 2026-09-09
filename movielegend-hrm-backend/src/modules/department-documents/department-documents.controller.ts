import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DepartmentDocumentsService } from './department-documents.service';
import { CreateDepartmentDocumentDto } from './dto/create-department-document.dto';
import { QueryDepartmentDocumentDto } from './dto/query-department-document.dto';

@ApiTags('Department Documents')
@ApiBearerAuth()
@Controller('department-documents')
export class DepartmentDocumentsController {
  constructor(private readonly service: DepartmentDocumentsService) {}

  @ApiOperation({ summary: 'Tải lên / Tạo mới tài liệu phòng ban' })
  @Post()
  create(@Body() dto: CreateDepartmentDocumentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.create(dto, actor);
  }

  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo phân quyền (Scoped)' })
  @Get()
  findAll(@Query() query: QueryDepartmentDocumentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAll(query, actor);
  }

  @ApiOperation({ summary: 'Chi tiết 1 tài liệu' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.findOne(id, actor);
  }

  @ApiOperation({ summary: 'Xóa tài liệu' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.remove(id, actor);
  }
}
