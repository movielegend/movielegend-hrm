import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNewsfeedPostDto, CreateCommentDto, ApprovePostDto } from './dto/newsfeed.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NewsfeedService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createPost(user: AuthenticatedUser, dto: CreateNewsfeedPostDto) {
    let status: 'PENDING' | 'APPROVED' = 'PENDING';
    const isAdmin = user.permissions.includes('admin') || user.roles.includes('ADMIN') || user.roles.includes('SYSTEM_ADMIN');
    let isLeader = false;
    let departmentLeaderId: string | null = null;
    let actualDepartmentId = dto.departmentId;

    if (!isAdmin && !actualDepartmentId) {
      const userDept = await this.prisma.departmentMember.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { departmentId: true }
      });
      if (userDept) {
        actualDepartmentId = userDept.departmentId;
      }
    }

    if (actualDepartmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: actualDepartmentId }
      });
      if (department) {
        departmentLeaderId = department.leaderUserId;
        if (department.leaderUserId === user.userId) {
          isLeader = true;
        }
      }
    }

    // Auto-approve if admin or if they are the leader of the department, or if company-wide and they are admin
    if (isAdmin || isLeader) {
      status = 'APPROVED';
    }

    const post = await this.prisma.newsfeedPost.create({
      data: {
        authorId: user.userId,
        content: dto.content,
        title: dto.title,
        departmentId: actualDepartmentId,
        images: dto.images,
        attachments: dto.attachments,
        status: status,
        approvedById: status === 'APPROVED' ? user.userId : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        author: {
          select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } }
        }
      }
    });

    if (status === 'PENDING' && departmentLeaderId) {
      // Send notification to leader
      const notifPayload = await this.prisma.$transaction(async (tx) => {
         return this.notificationsService.createForUsers(tx, [departmentLeaderId!], {
           type: NotificationType.NEWSFEED_POST_PENDING,
           title: 'Bài đăng mới cần duyệt',
           body: `${post.author.profile?.fullName || post.author.userCode} vừa đăng một bài viết mới trong phòng ban.`,
           metadata: { postId: post.id }
         });
      });
      if (notifPayload) this.notificationsService.emitCreated(notifPayload);
    }

    return post;
  }

  async getPosts(departmentId?: string) {
    const where = { status: 'APPROVED' as const };
      
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

  async getPendingPosts(user: AuthenticatedUser, departmentId?: string) {
    const isAdmin = user.permissions.includes('admin') || user.roles.includes('ADMIN') || user.roles.includes('SYSTEM_ADMIN');
    
    // If not admin, they can only see pending posts for departments they lead
    const leaderDepartments = await this.prisma.department.findMany({
      where: { leaderUserId: user.userId },
      select: { id: true }
    });
    
    const leaderDepIds = leaderDepartments.map(d => d.id);
    if (!isAdmin && leaderDepIds.length === 0) {
      throw new ForbiddenException('Bạn không có quyền duyệt bài viết');
    }

    let depFilter: any = isAdmin ? undefined : { in: leaderDepIds };
    if (departmentId) {
       if (!isAdmin && !leaderDepIds.includes(departmentId)) {
         throw new ForbiddenException('Bạn không phải là leader của phòng ban này');
       }
       depFilter = departmentId;
    }

    return this.prisma.newsfeedPost.findMany({
      where: { 
        status: 'PENDING',
        departmentId: depFilter
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } }
        }
      }
    });
  }

  async approvePost(id: string, user: AuthenticatedUser, dto: ApprovePostDto) {
    const post = await this.prisma.newsfeedPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    
    if (post.status !== 'PENDING') {
      throw new ForbiddenException(`Bài viết đã được ${post.status === 'APPROVED' ? 'duyệt' : 'từ chối'} trước đó`);
    }

    const isAdmin = user.permissions.includes('admin') || user.roles.includes('ADMIN') || user.roles.includes('SYSTEM_ADMIN');
    if (!isAdmin) {
      if (!post.departmentId) {
        throw new ForbiddenException('Chỉ admin mới được duyệt bài viết toàn công ty');
      }
      const department = await this.prisma.department.findUnique({ where: { id: post.departmentId } });
      if (!department || department.leaderUserId !== user.userId) {
        throw new ForbiddenException('Chỉ leader của phòng ban mới được duyệt bài viết này');
      }
    }

    const updated = await this.prisma.newsfeedPost.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        approvedById: user.userId,
        approvedAt: new Date()
      }
    });

    // Notify the author
    const notifPayload = await this.prisma.$transaction(async (tx) => {
      const type = dto.status === 'APPROVED' ? NotificationType.NEWSFEED_POST_APPROVED : NotificationType.NEWSFEED_POST_REJECTED;
      const title = dto.status === 'APPROVED' ? 'Bài đăng đã được duyệt' : 'Bài đăng bị từ chối';
      const body = dto.status === 'APPROVED' 
        ? 'Bài đăng của bạn đã được duyệt và hiển thị trên bảng tin.' 
        : `Bài đăng của bạn đã bị từ chối. ${dto.rejectionReason ? `Lý do: ${dto.rejectionReason}` : ''}`;
      
      return this.notificationsService.createForUsers(tx, [post.authorId], {
        type,
        title,
        body,
        metadata: { postId: post.id }
      });
    });
    if (notifPayload) this.notificationsService.emitCreated(notifPayload);

    return updated;
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

    // Notify the author
    const post = await this.prisma.newsfeedPost.findUnique({
      where: { id: postId },
      select: { authorId: true, title: true }
    });
    const liker = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    if (post && post.authorId !== userId && liker?.profile) {
      const notifPayload = await this.prisma.$transaction(async (tx) => {
        return this.notificationsService.createForUsers(tx, [post.authorId], {
          type: NotificationType.SYSTEM,
          title: 'Có người vừa thả tim bài viết của bạn',
          body: `${liker?.profile?.fullName || 'Người dùng'} đã thích bài viết của bạn.`,
          metadata: { postId, action: 'LIKE' }
        });
      });
      if (notifPayload) this.notificationsService.emitCreated(notifPayload);
    }

    return { liked: true };
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content
      },
      include: {
        author: { select: { id: true, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });

    const post = await this.prisma.newsfeedPost.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });
    
    if (post && post.authorId !== userId && comment.author?.profile) {
      const notifPayload = await this.prisma.$transaction(async (tx) => {
        return this.notificationsService.createForUsers(tx, [post.authorId], {
          type: NotificationType.SYSTEM,
          title: 'Bình luận mới về bài viết của bạn',
          body: `${comment.author?.profile?.fullName || 'Người dùng'} đã bình luận: "${dto.content.substring(0, 50)}${dto.content.length > 50 ? '...' : ''}"`,
          metadata: { postId, action: 'COMMENT' }
        });
      });
      if (notifPayload) this.notificationsService.emitCreated(notifPayload);
    }

    return comment;
  }

  async deletePost(id: string) {
    const post = await this.prisma.newsfeedPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.newsfeedPost.delete({ where: { id } });
  }
}

