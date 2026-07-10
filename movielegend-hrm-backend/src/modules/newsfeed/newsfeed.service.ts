import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNewsfeedPostDto, CreateCommentDto } from './dto/newsfeed.dto';

@Injectable()
export class NewsfeedService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, dto: CreateNewsfeedPostDto) {
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

  async getPosts(departmentId?: string) {
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
          select: { userId: true } // to know who liked
        }
      }
    });
  }

  async getPostById(id: string) {
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
        likes: { 
          include: { 
            user: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } } 
          } 
        },
        _count: { select: { comments: true, likes: true } }
      }
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async likePost(userId: string, postId: string) {
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

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
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

  async deletePost(id: string) {
    const post = await this.prisma.newsfeedPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.newsfeedPost.delete({ where: { id } });
  }
}

