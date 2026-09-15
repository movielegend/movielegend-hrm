import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Permissions('department.create')
  create(@Body() createBranchDto: CreateBranchDto, @Request() req: any) {
    return this.branchesService.create(createBranchDto, req.user);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.branchesService.findAll(req.user);
  }

  @Get('restore-deleted')
  restoreDeleted() {
    return this.branchesService.restoreDeleted();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('department.update')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @Request() req: any) {
    return this.branchesService.update(id, updateBranchDto, req.user);
  }

  @Delete(':id')
  @Permissions('department.delete')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.branchesService.remove(id, req.user);
  }
}


