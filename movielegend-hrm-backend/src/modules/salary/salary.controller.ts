import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateEmployeeSalaryComponentDto, CreateSalaryComponentDto, CreateSalaryProfileDto } from './dto/salary.dto';
import { SalaryService } from './salary.service';

@ApiTags('Salary Profiles')
@ApiBearerAuth()
@Controller('salary-profiles')
export class SalaryProfilesController {
  constructor(private readonly salary: SalaryService) {}

  @Post()
  @Permissions('salary_profile.create')
  create(@Body() dto: CreateSalaryProfileDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.salary.createProfile(dto, actor);
  }

  @Get()
  @Permissions('salary_profile.read')
  findAll() {
    return this.salary.findProfiles();
  }

  @Get('user/:userId')
  @Permissions('salary_profile.read')
  findByUser(@Param('userId') userId: string) {
    return this.salary.findProfilesByUser(userId);
  }

  @Post(':id/end')
  @Permissions('salary_profile.update')
  end(@Param('id') id: string, @Body('effectiveTo') effectiveTo: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.salary.endProfile(id, effectiveTo, actor);
  }
}

@ApiTags('Salary Components')
@ApiBearerAuth()
@Controller()
export class SalaryComponentsController {
  constructor(private readonly salary: SalaryService) {}

  @Post('salary-components')
  @Permissions('salary_component.create')
  createComponent(@Body() dto: CreateSalaryComponentDto) {
    return this.salary.createComponent(dto);
  }

  @Get('salary-components')
  @Permissions('salary_component.read')
  findComponents() {
    return this.salary.findComponents();
  }

  @Patch('salary-components/:id')
  @Permissions('salary_component.update')
  updateComponent(@Param('id') id: string, @Body() dto: Partial<CreateSalaryComponentDto>) {
    return this.salary.updateComponent(id, dto);
  }

  @Post('employee-salary-components')
  @Permissions('salary_component.create')
  createEmployeeComponent(@Body() dto: CreateEmployeeSalaryComponentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.salary.createEmployeeComponent(dto, actor);
  }
}
