import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ContractFieldPresetService } from './contract-field-preset.service';
import { CreateContractFieldPresetDto, UpdateContractFieldPresetDto } from './dto/contract-field-preset.dto';

@ApiTags('Contract Field Presets')
@ApiBearerAuth()
@Controller('contract-field-presets')
export class ContractFieldPresetController {
  constructor(private readonly presetService: ContractFieldPresetService) {}

  @Post()
  @Permissions('contract_template.create')
  create(@Body() createDto: CreateContractFieldPresetDto, @CurrentUser() user: AuthenticatedUser) {
    return this.presetService.create(createDto, user);
  }

  @Get('resolve')
  @Permissions('contract.create')
  resolveForEmployee(
    @Query('templateId') templateId: string,
    @Query('userId') userId: string
  ) {
    return this.presetService.resolveForEmployee(templateId, userId);
  }

  @Get()
  @Permissions('contract_template.read')
  findAll(
    @Query('templateId') templateId?: string,
    @Query('departmentId') departmentId?: string
  ) {
    return this.presetService.findAll(templateId, departmentId);
  }

  @Get(':id')
  @Permissions('contract_template.read')
  findOne(@Param('id') id: string) {
    return this.presetService.findOne(id);
  }

  @Patch(':id')
  @Permissions('contract_template.update')
  update(@Param('id') id: string, @Body() updateDto: UpdateContractFieldPresetDto) {
    return this.presetService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('contract_template.create')
  remove(@Param('id') id: string) {
    return this.presetService.remove(id);
  }
}
