import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @AnyPermissions('department.create', 'branch.create', 'user.read', 'employee.read')
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
  @AnyPermissions('department.update', 'branch.update', 'user.read', 'employee.read')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @Request() req: any) {
    return this.branchesService.update(id, updateBranchDto, req.user);
  }

  @Delete(':id')
  @AnyPermissions('department.delete', 'branch.delete', 'user.read', 'employee.read')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.branchesService.remove(id, req.user);
  }
}


