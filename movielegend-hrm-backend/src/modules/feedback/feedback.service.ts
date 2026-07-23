import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

type AuthenticatedUser = {
    userId: string;
    roles?: string[];
    permissions?: string[];
    departmentId?: string | null;
};

@Injectable()
export class FeedbackService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService
    ) { }

    // ─── Create ────────────────────────────────────────────────────────────────

    async create(user: AuthenticatedUser, dto: CreateFeedbackDto) {
        const feedback = await this.prisma.feedback.create({
            data: {
                title: dto.title,
                content: dto.content,
                senderUserId: user.userId,
                isAnonymous: dto.isAnonymous,
                img: dto.img ?? null,
            },
            select: {
                id: true,
                title: true,
                content: true,
                isAnonymous: true,
                status: true,
                img: true,
                createdAt: true,
            },
        });

        const admins = await this.prisma.userRole.findMany({
            where: { role: { code: 'ADMIN' } },
            select: { userId: true },
        });

        if (admins.length > 0) {
            const adminUserIds = admins.map(a => a.userId);
            const notifTitle = dto.isAnonymous ? 'Góp ý mới (Ẩn danh)' : 'Có góp ý mới từ nhân viên';
            await this.prisma.$transaction(async (tx) => {
                const notif = await this.notifications.createForUsers(tx as any, adminUserIds, {
                    type: 'SYSTEM' as NotificationType,
                    title: notifTitle,
                    body: `Tiêu đề: ${dto.title}`,
                });
                if (notif) this.notifications.emitCreated(notif);
            });
        }

        return feedback;
    }

    // ─── Get my feedbacks ───────────────────────────────────────────────────────

    async getMyFeedbacks(
        user: AuthenticatedUser,
        query: FeedbackQueryDto,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.FeedbackWhereInput = {
            senderUserId: user.userId,
            deletedAt: null,
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { title: { contains: query.search, mode: 'insensitive' } },
                        { content: { contains: query.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.feedback.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    isAnonymous: true,
                    status: true,
                    reason: true,
                    img: true,
                    reviewedAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.feedback.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── Get for management ─────────────────────────────────────────────────────

    async getForManagement(
        user: AuthenticatedUser,
        query: FeedbackQueryDto,
    ) {

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.FeedbackWhereInput = {
            deletedAt: null,
            ...(query.status ? { status: query.status } : {}),
            ...(typeof query.isAnonymous === 'boolean'
                ? { isAnonymous: query.isAnonymous }
                : {}),
            ...(query.search
                ? {
                    OR: [
                        { title: { contains: query.search, mode: 'insensitive' } },
                        { content: { contains: query.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.feedback.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    sender: {
                        select: {
                            id: true,
                            userCode: true,
                            email: true,
                            phone: true,
                            profile: {
                                select: { fullName: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.feedback.count({ where }),
        ]);

        const sanitizedItems = items.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            isAnonymous: item.isAnonymous,
            status: item.status,
            reason: item.reason,
            img: item.img,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            reviewedAt: item.reviewedAt,

            // Ẩn thông tin người gửi nếu là anonymous
            sender: item.isAnonymous
                ? null
                : {
                    id: item.sender.id,
                    userCode: item.sender.userCode,
                    fullName: item.sender.profile?.fullName ?? null,
                    email: item.sender.email,
                    phone: item.sender.phone,
                },

            senderDisplayName: item.isAnonymous
                ? 'Ẩn danh'
                : item.sender.profile?.fullName ?? item.sender.userCode,
        }));

        return {
            items: sanitizedItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── Get detail ─────────────────────────────────────────────────────────────

    async getDetail(user: AuthenticatedUser, id: string) {
        const feedback = await this.prisma.feedback.findFirst({
            where: { id, deletedAt: null },
            include: {
                sender: {
                    select: {
                        id: true,
                        userCode: true,
                        email: true,
                        phone: true,
                        profile: {
                            select: { fullName: true },
                        },
                    },
                },
            },
        });

        if (!feedback) {
            throw new NotFoundException('Không tìm thấy góp ý');
        }

        const isOwner = feedback.senderUserId === user.userId;
        const hasReadAll = user.roles?.includes('ADMIN') || user.roles?.includes('HR') || user.permissions?.includes('feedback.read_all');

        if (!isOwner && !hasReadAll) {
            throw new ForbiddenException('Bạn không có quyền xem góp ý này');
        }

        return {
            id: feedback.id,
            title: feedback.title,
            content: feedback.content,
            isAnonymous: feedback.isAnonymous,
            status: feedback.status,
            reason: feedback.reason,
            img: feedback.img,
            reviewedAt: feedback.reviewedAt,
            createdAt: feedback.createdAt,
            // Chỉ lộ sender nếu: (1) không anonymous, hoặc (2) chính chủ xem
            sender:
                feedback.isAnonymous && !isOwner
                    ? null
                    : {
                        id: feedback.sender.id,
                        userCode: feedback.sender.userCode,
                        fullName: feedback.sender.profile?.fullName ?? null,
                    },
        };
    }

    // ─── Update status ──────────────────────────────────────────────────────────

    async updateStatus(
        user: AuthenticatedUser,
        id: string,
        dto: UpdateFeedbackStatusDto,
    ) {
        const exists = await this.prisma.feedback.findFirst({
            where: { id, deletedAt: null },
            select: { id: true, status: true, senderUserId: true },
        });

        if (!exists) {
            throw new NotFoundException('Không tìm thấy góp ý');
        }

        const feedback = await this.prisma.feedback.update({
            where: { id },
            data: {
                status: dto.status,
                reason: dto.reason?.trim() || null,
                reviewedAt: new Date(),
            },
            select: {
                id: true,
                title: true,
                status: true,
                reason: true,
                reviewedAt: true,
            },
        });

        const statusMap: Record<string, string> = {
            'PROCESSING': 'Đang xử lý',
            'APPROVED': 'Đã duyệt',
            'REJECTED': 'Đã từ chối',
        };
        const statusText = statusMap[dto.status] || dto.status;

        await this.prisma.$transaction(async (tx) => {
            const notif = await this.notifications.createForUsers(tx as any, [exists.senderUserId], {
                type: 'SYSTEM' as NotificationType,
                title: 'Phản hồi góp ý',
                body: `Góp ý của bạn đã được chuyển sang trạng thái: ${statusText}.`,
            });
            if (notif) this.notifications.emitCreated(notif);
        });

        return feedback;
    }

    // ─── Delete own feedback ────────────────────────────────────────────────────

    async deleteMine(user: AuthenticatedUser, id: string) {
        const feedback = await this.prisma.feedback.findFirst({
            where: { id, deletedAt: null },
            select: { id: true, senderUserId: true, status: true },
        });

        if (!feedback) {
            throw new NotFoundException('Không tìm thấy góp ý');
        }

        if (feedback.senderUserId !== user.userId) {
            throw new ForbiddenException('Bạn chỉ có thể xóa góp ý của chính mình');
        }

        if (feedback.status !== 'SEND') {
            throw new BadRequestException(
                'Chỉ có thể xóa góp ý đang ở trạng thái SEND (chưa được xem xét)',
            );
        }

        await this.prisma.feedback.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return undefined;
    }

    // ─── Stats (management) ─────────────────────────────────────────────────────

    async getStats(user: AuthenticatedUser) {

        const [total, byStatus, anonymous] = await this.prisma.$transaction([
            this.prisma.feedback.count({ where: { deletedAt: null } }),
            this.prisma.feedback.groupBy({
                by: ['status'],
                where: { deletedAt: null },
                _count: { _all: true },
                orderBy: { status: 'asc' },
            }),
            this.prisma.feedback.count({
                where: { deletedAt: null, isAnonymous: true },
            }),
        ]);

        const statusMap: Record<string, number> = {};
        for (const row of byStatus) {
            statusMap[row.status] = (row._count as any)?._all ?? 0;
        }

        return {
            total,
            byStatus: {
                SEND: statusMap['SEND'] ?? 0,
                REVIEWED: statusMap['REVIEWED'] ?? 0,
                RESOLVED: statusMap['RESOLVED'] ?? 0,
                REJECTED: statusMap['REJECTED'] ?? 0,
            },
            anonymous,
            nonAnonymous: total - anonymous,
        };
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

}