import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateMaterialCategoryDto, CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller()
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Post('material-categories')
  @Permissions('material.create')
  createCategory(@Body() dto: CreateMaterialCategoryDto) {
    return this.materials.createCategory(dto);
  }

  @Get('material-categories')
  @Permissions('material.read')
  findCategories() {
    return this.materials.findCategories();
  }

  @Post('materials')
  @Permissions('material.create')
  create(@Body() dto: CreateMaterialDto) {
    return this.materials.create(dto);
  }

  @Get('materials')
  @Permissions('material.read')
  findAll() {
    return this.materials.findAll();
  }

  @Get('materials/:id')
  @Permissions('material.read')
  findOne(@Param('id') id: string) {
    return this.materials.findOne(id);
  }

  @Patch('materials/:id')
  @Permissions('material.update')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materials.update(id, dto);
  }
}
