"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsfeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let NewsfeedService = class NewsfeedService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(userId, dto) {
        return this.prisma.newsfeedPost.create({
            data: {
                authorId: userId,
                content: dto.content,
                title: dto.title,
                departmentId: dto.departmentId,
                images: dto.images,
                attachments: dto.attachments,
            },
            include: {
                author: {
                    select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } }
                }
            }
        });
    }
    async getPosts(departmentId) {
        const where = departmentId
            ? { OR: [{ departmentId: null }, { departmentId }] }
            : { departmentId: null };
        return this.prisma.newsfeedPost.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } }
                },
                _count: { select: { comments: true, likes: true } },
                likes: {
                    select: { userId: true }
                }
            }
        });
    }
    async getPostById(id) {
        const post = await this.prisma.newsfeedPost.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } },
                comments: {
                    include: {
                        author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                likes: { select: { userId: true } },
                _count: { select: { comments: true, likes: true } }
            }
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
    async likePost(userId, postId) {
        const existing = await this.prisma.postLike.findUnique({
            where: { postId_userId: { postId, userId } }
        });
        if (existing) {
            await this.prisma.postLike.delete({ where: { id: existing.id } });
            return { liked: false };
        }
        await this.prisma.postLike.create({ data: { postId, userId } });
        return { liked: true };
    }
    async addComment(userId, postId, dto) {
        return this.prisma.postComment.create({
            data: {
                postId,
                authorId: userId,
                content: dto.content
            },
            include: {
                author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } }
            }
        });
    }
};
exports.NewsfeedService = NewsfeedService;
exports.NewsfeedService = NewsfeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsfeedService);
//# sourceMappingURL=newsfeed.service.js.map