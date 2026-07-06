import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreatePositionDto, PositionQueryDto, UpdatePositionDto } from './dto/position.dto';
import { PositionsService } from './positions.service';

@ApiTags('Positions')
@ApiBearerAuth()
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Permissions('position.read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PositionQueryDto) {
    return this.positionsService.findAll(user, query);
  }

  @Permissions('position.read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.positionsService.findOne(user, id);
  }

  @Permissions('position.create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePositionDto) {
    return this.positionsService.create(user, dto);
  }

  @Permissions('position.update')
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positionsService.update(user, id, dto);
  }

  @Permissions('position.delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.positionsService.remove(user, id);
  }
}
