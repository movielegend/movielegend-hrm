import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyHolidayService } from './company-holiday.service';
import { CreateCompanyHolidayDto, UpdateCompanyHolidayDto } from './dto/company-holiday.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company-holidays')
export class CompanyHolidayController {
  constructor(private readonly holidayService: CompanyHolidayService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.holidayService.findAll();
  }

  @Get('company/:companyId')
  @Roles('ADMIN')
  findByCompanyId(@Param('companyId') companyId: string) {
    return this.holidayService.findByCompanyId(companyId);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCompanyHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyHolidayDto) {
    return this.holidayService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.holidayService.remove(id);
  }
}
