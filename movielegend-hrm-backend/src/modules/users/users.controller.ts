import { Body, Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateFaceDto, UpdateMeDto } from './dto/update-me.dto';
import { UpdatePinnedAppsDto } from './dto/update-pinned-apps.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateMe(@Body() dto: UpdateMeDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.updateMe(dto, actor);
  }

  @Patch('me/face')
  updateMyFace(@Body() dto: UpdateFaceDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.updateMyFace(dto, actor);
  }

  @Get('me/pinned-apps')
  @ApiOperation({ summary: 'Lấy danh sách các ứng dụng được ghim trên trang chủ của người dùng' })
  getMyPinnedApps(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.getMyPinnedApps(actor);
  }

  @Put('me/pinned-apps')
  @ApiOperation({ summary: 'Cập nhật danh sách các ứng dụng được ghim trên trang chủ' })
  updateMyPinnedApps(@Body() dto: UpdatePinnedAppsDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.updateMyPinnedApps(dto, actor);
  }

  @Post('me/pinned-apps/reset')
  @ApiOperation({ summary: 'Khôi phục danh sách ứng dụng ghim về mặc định' })
  resetMyPinnedApps(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.resetMyPinnedApps(actor);
  }
}
