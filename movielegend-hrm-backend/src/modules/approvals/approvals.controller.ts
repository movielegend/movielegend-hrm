import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { RejectDto } from './dto/reject.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals/accounts')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Permissions('approval.read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ApprovalQueryDto) {
    return this.approvalsService.findAll(user, query);
  }

  @Permissions('approval.approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.approve(id, user);
  }

  @Permissions('approval.reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.reject(id, dto, user);
  }
}
