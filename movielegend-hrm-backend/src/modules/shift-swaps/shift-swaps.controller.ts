import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ShiftSwapsService } from './shift-swaps.service';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { UpdateShiftSwapStatusDto } from './dto/update-shift-swap-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('shift-swaps')
@UseGuards(JwtAuthGuard)
export class ShiftSwapsController {
  constructor(private readonly shiftSwapsService: ShiftSwapsService) {}

  @Post()
  create(@Body() createShiftSwapDto: CreateShiftSwapDto, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.create(createShiftSwapDto, user);
  }

  @Get('target-shift/:userId/:date')
  getTargetShift(
    @Param('userId') userId: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.shiftSwapsService.getTargetShift(userId, date, user);
  }

  @Get('available-targets')
  getAvailableTargets(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.getAvailableTargets(user);
  }

  @Get('me')
  findMySwaps(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.findMySwaps(user);
  }

  @Get('leader-pending')
  findLeaderPendingSwaps(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.findLeaderPendingSwaps(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.findOne(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateShiftSwapStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shiftSwapsService.updateStatus(id, updateStatusDto, user);
  }
}
