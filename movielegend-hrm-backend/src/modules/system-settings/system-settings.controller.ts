import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpsertSystemSettingDto } from './dto/system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly settings: SystemSettingsService) {}

  @Get()
  @Permissions('system_setting.read')
  findAll(@CurrentUser() actor: AuthenticatedUser, @Query('companyId') companyId?: string) {
    return this.settings.findAll(actor, companyId);
  }

  @Post()
  @Permissions('system_setting.update')
  upsert(@Body() dto: UpsertSystemSettingDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.settings.upsert(dto, actor);
  }
}
