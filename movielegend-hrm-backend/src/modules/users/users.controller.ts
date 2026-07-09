import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateFaceDto, UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';
import { ApiProperty } from '@nestjs/swagger';

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
}
