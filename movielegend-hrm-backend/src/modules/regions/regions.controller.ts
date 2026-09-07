import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { RegionsService } from './regions.service';

@ApiTags('Regions')
@ApiBearerAuth()
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @Permissions('department.create')
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.regionsService.findAll(req.user);
  }

  @Get('restore-deleted')
  @Permissions('department.update')
  restoreDeleted() {
    return this.regionsService.restoreDeleted();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('department.update')
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @Permissions('department.delete')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }
}
