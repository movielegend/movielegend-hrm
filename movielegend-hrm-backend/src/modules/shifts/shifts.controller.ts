import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';
import { ShiftsService } from './shifts.service';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Permissions('shift.create')
  @Post()
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  @Permissions('shift.read')
  @Get()
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  findAll(@Query('departmentId') departmentId?: string) {
    return this.shiftsService.findAll(departmentId);
  }

  @Permissions('shift.update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  @Permissions('shift.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
