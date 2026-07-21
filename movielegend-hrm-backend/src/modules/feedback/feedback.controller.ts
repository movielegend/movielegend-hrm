import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnyPermissions } from '../../common/decorators/any-permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedbacks')
@ApiBearerAuth()
@Controller('feedbacks')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    // ─── User / Leader ──────────────────────────────────────────────────────────

    @Post()
    @Permissions('feedback.create')
    @ApiOperation({ summary: 'Gửi góp ý mới (User/Leader, có thể ẩn danh)' })
    create(
        @Body() dto: CreateFeedbackDto,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.create(actor, dto);
    }

    @Get('me')
    @Permissions('feedback.read_own')
    @ApiOperation({ summary: 'Xem danh sách góp ý của chính mình' })
    findMine(
        @Query() query: FeedbackQueryDto,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.getMyFeedbacks(actor, query);
    }

    @Delete(':id')
    @Permissions('feedback.read_own')
    @ApiOperation({ summary: 'Xóa góp ý của mình (chỉ khi trạng thái SEND)' })
    deleteMine(
        @Param('id') id: string,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.deleteMine(actor, id);
    }

    // ─── Management (ADMIN / HR / LEADER) ──────────────────────────────────────

    @Get('stats')
    @Permissions('feedback.read_all')
    @ApiOperation({ summary: 'Thống kê tổng quan góp ý (Management)' })
    getStats(@CurrentUser() actor: AuthenticatedUser) {
        return this.feedbackService.getStats(actor);
    }

    @Get()
    @Permissions('feedback.read_all')
    @ApiOperation({ summary: 'Danh sách tất cả góp ý (Management)' })
    findForManagement(
        @Query() query: FeedbackQueryDto,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.getForManagement(actor, query);
    }

    @Get(':id')
    @AnyPermissions('feedback.read_all', 'feedback.read_own')
    @ApiOperation({ summary: 'Chi tiết một góp ý (Management hoặc của chính mình)' })
    findOne(
        @Param('id') id: string,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.getDetail(actor, id);
    }

    @Patch(':id/status')
    @Permissions('feedback.update_status')
    @ApiOperation({ summary: 'Cập nhật trạng thái góp ý (REVIEWED/RESOLVED/REJECTED)' })
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateFeedbackStatusDto,
        @CurrentUser() actor: AuthenticatedUser,
    ) {
        return this.feedbackService.updateStatus(actor, id, dto);
    }
}