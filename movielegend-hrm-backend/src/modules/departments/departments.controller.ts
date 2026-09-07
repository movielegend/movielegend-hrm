import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Permissions('department.create')
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Public()
  @Get('public')
  findPublic(@Query('search') search?: string, @CurrentUser() user?: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.departmentsService.findAll(search, user);
  }

  @Permissions('department.read')
  @Get()
  findAll(@Query() query: any, @CurrentUser() user?: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    return this.departmentsService.findAll(query.search, user, query.all === 'true');
  }

  @Permissions('department.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Permissions('department.update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Permissions('department.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
