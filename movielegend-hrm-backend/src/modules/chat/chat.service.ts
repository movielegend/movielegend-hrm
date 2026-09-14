import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
    private readonly scopes: DepartmentScopeService
  ) {}

  // Get or Create group for a department
  async getGroupForDepartment(departmentId: string) {
    const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new NotFoundException('Department not found');

    return this.prisma.chatGroup.upsert({
      where: { departmentId },
      create: {
        departmentId,
        name: `Nhóm ${dept.name}`,
        type: 'DEPARTMENT'
      },
      update: {}
    });
  }

  async getMessages(groupId: string, actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser, skip: number = 0, take: number = 50) {
    const userId = actor.userId;
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Chat group not found');

    const member = await this.prisma.chatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { clearedAt: true, joinedAt: true }
    });

    if (!member) {
      if (group.type === 'DIRECT') {
        throw new ForbiddenException('You do not have permission to read this direct chat');
      }
      
      const isGlobalAdmin = actor.roles.includes('ADMIN') && (await this.scopes.getVisibleDepartmentIds(actor)) === null;
      let hasAccess = false;

      if (isGlobalAdmin) {
        hasAccess = true;
      } else {
        if (group.type === 'CUSTOM' || group.type === 'TASK') {
          // Regional admins can view CUSTOM/TASK if they are in the group, but we already know they are not a member here.
          // Let's see if we should allow regional admin to view TASK. For now, deny.
          hasAccess = false;
        } else if (group.type === 'DEPARTMENT' && group.departmentId) {
          const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
          if (visibleDepts && visibleDepts.includes(group.departmentId)) {
            hasAccess = true;
          } else {
            const deptMember = await this.prisma.departmentMember.findUnique({
              where: { departmentId_userId: { userId, departmentId: group.departmentId } }
            });
            if (deptMember && !deptMember.leftAt) {
              hasAccess = true;
            }
          }
        }
      }

      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to read this chat');
      }
    }

    const whereClause: any = { groupId };
    
    if (member?.clearedAt) {
      whereClause.createdAt = { gt: member.clearedAt };
    }

    return this.prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        replyTo: {
          select: {
            id: true,
            content: true,
            fileUrl: true,
            fileType: true,
            fileName: true,
            sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
          }
        }
      }
    });
  }

  async clearChatHistory(groupId: string, userId: string) {
    const member = await this.prisma.chatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member) throw new NotFoundException('You are not a member of this chat group');

    await this.prisma.chatGroupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { clearedAt: new Date() }
    });

    return { success: true };
  }

  async sendMessage(actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser, groupId: string, dto: CreateChatMessageDto) {
    const userId = actor.userId;
    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: { select: { userId: true } } }
    });
    if (!group) throw new NotFoundException('Chat group not found');

    const isGlobalAdmin = actor.roles.includes('ADMIN') && (await this.scopes.getVisibleDepartmentIds(actor)) === null;

    const member = await this.prisma.chatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member && !isGlobalAdmin) {
      if (group.type === 'DIRECT' || group.type === 'CUSTOM' || group.type === 'TASK') {
        throw new ForbiddenException('You do not have permission to send messages to this chat');
      }
      if (group.type === 'DEPARTMENT' && group.departmentId) {
        const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
        if (visibleDepts && visibleDepts.includes(group.departmentId)) {
          // Regional admin has access
        } else {
          const deptMember = await this.prisma.departmentMember.findUnique({
            where: { departmentId_userId: { userId, departmentId: group.departmentId } }
          });
          if (!deptMember || deptMember.leftAt) {
            throw new ForbiddenException('You do not have permission to send messages to this chat');
          }
        }
      }
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        groupId,
        senderId: userId,
        replyToId: dto.replyToId,
        content: dto.content,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileName: dto.fileName,
        mentions: dto.mentions ?? []
      },
      include: {
        sender: { select: { id: true, userCode: true, roles: { include: { role: true } }, profile: { select: { fullName: true, avatarUrl: true } } } },
        replyTo: {
          select: {
            id: true,
            content: true,
            fileUrl: true,
            fileType: true,
            fileName: true,
            sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
          }
        }
      }
    });

    const isAdmin = message.sender?.roles?.some((r: any) => r.role?.code?.toUpperCase().includes('ADMIN'));
    const senderName = isAdmin ? 'Admin' : (message.sender?.profile?.fullName ?? message.sender.userCode);

    // 1. Phát tín hiệu qua WebSocket ngay lập tức (0ms latency)
    this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', message);
    this.realtime.emitToRoom('company', 'chat:group_updated', { groupId, latestMessage: message });

    // 2. Chạy ngầm các tác vụ DB phụ và thông báo (Non-blocking async background)
    setImmediate(async () => {
      try {
        await Promise.all([
          this.prisma.chatGroup.update({
            where: { id: groupId },
            data: { updatedAt: new Date() }
          }).catch(() => {}),
          this.prisma.chatGroupMember.upsert({
            where: { groupId_userId: { groupId, userId } },
            create: { groupId, userId, lastReadAt: new Date() },
            update: { lastReadAt: new Date() }
          }).catch(() => {})
        ]);

        if (group.type === 'DEPARTMENT' && group.departmentId) {
          const deptMembers = await this.prisma.departmentMember.findMany({
            where: { departmentId: group.departmentId, leftAt: null },
            select: { userId: true }
          });
          for (const dm of deptMembers) {
            if (dm.userId !== userId) {
              this.realtime.emitToUser(dm.userId, 'chat:message', message);
            }
          }

          const notifyMembers = deptMembers.filter(m => m.userId !== userId);
          if (notifyMembers.length > 0) {
            await this.prisma.$transaction(async (tx) => {
              const notificationBody = message.content?.startsWith('GIPHY_STICKER:') || message.content?.startsWith('LOTTIE_STICKER:') || message.content?.startsWith('STATIC_STICKER:')
                ? '[Nhãn dán]'
                : message.content ?? (message.fileType === 'IMAGE' ? '[Hình ảnh]' : '[Tệp tin đính kèm]');

              const payload = await this.notifications.createForUsers(
                tx as any,
                notifyMembers.map(m => m.userId),
                {
                  type: 'CHAT_MESSAGE',
                  title: `Tin nhắn mới từ ${senderName} (Nhóm: ${group.name || 'Chung'})`,
                  body: notificationBody,
                  metadata: { groupId: group.id, messageId: message.id }
                }
              );
              if (payload) this.notifications.emitCreated(payload);
            });
          }
        } else {
          const members = await this.prisma.chatGroupMember.findMany({
            where: { groupId }
          });
          for (const m of members) {
            if (m.userId !== userId) {
              this.realtime.emitToUser(m.userId, 'chat:message', message);
            }
          }

          const otherMembers = members.filter(m => m.userId !== userId);
          if (otherMembers.length > 0) {
            await this.prisma.$transaction(async (tx) => {
              const notificationBody = message.content?.startsWith('GIPHY_STICKER:') || message.content?.startsWith('LOTTIE_STICKER:') || message.content?.startsWith('STATIC_STICKER:')
                ? '[Nhãn dán]'
                : message.content ?? (message.fileType === 'IMAGE' ? '[Hình ảnh]' : '[Tệp tin đính kèm]');

              const payload = await this.notifications.createForUsers(
                tx as any,
                otherMembers.map(m => m.userId),
                {
                  type: 'CHAT_MESSAGE',
                  title: group.type === 'DIRECT' 
                    ? `Tin nhắn mới từ ${senderName}` 
                    : `Tin nhắn mới từ ${senderName} (Nhóm: ${group.name || 'Cá nhân'})`,
                  body: notificationBody,
                  metadata: { groupId: group.id, messageId: message.id }
                }
              );
              if (payload) this.notifications.emitCreated(payload);
            });
          }
        }
      } catch (err) {
        console.error('[ChatService] Background update/notification error:', err);
      }
    });

    return message;
  }

  private async getUnreadCounts(groupIds: string[], userId: string): Promise<Record<string, number>> {
    if (!groupIds || groupIds.length === 0) return {};

    const unreadCounts: Record<string, number> = {};
    for (const gid of groupIds) {
      unreadCounts[gid] = 0;
    }

    try {
      const formattedGroupIds = Prisma.join(groupIds.map(id => Prisma.sql`${id}::uuid`));
      const results: Array<{ groupId: string; count: number | bigint | string }> = await this.prisma.$queryRaw`
        SELECT 
          cm."groupId"::text as "groupId",
          COUNT(cm.id)::int as "count"
        FROM chat_messages cm
        LEFT JOIN chat_group_members cgm 
          ON cgm."groupId" = cm."groupId" AND cgm."userId" = ${userId}::uuid
        WHERE cm."groupId" IN (${formattedGroupIds})
          AND cm."senderId" != ${userId}::uuid
          AND (
            (cgm."lastReadAt" IS NOT NULL AND cm."createdAt" > cgm."lastReadAt")
            OR
            (cgm."lastReadAt" IS NULL AND (cgm."clearedAt" IS NULL OR cm."createdAt" > cgm."clearedAt"))
          )
        GROUP BY cm."groupId"
      `;

      for (const row of results) {
        unreadCounts[row.groupId] = Number(row.count) || 0;
      }
    } catch (err) {
      console.error('[ChatService] getUnreadCounts queryRaw error:', err);
    }

    return unreadCounts;
  }

  async getMyGroups(userId: string) {
    // Get departments where user is a member
    const memberships = await this.prisma.departmentMember.findMany({
      where: { userId, leftAt: null },
      select: { departmentId: true, department: { select: { name: true } } }
    });

    const groups = [];
    for (const m of memberships) {
      const group = await this.getGroupForDepartment(m.departmentId);
      groups.push(group);
    }

    // Get ad-hoc chat groups (e.g., tasks) where user is a member
    const customMemberships = await this.prisma.chatGroupMember.findMany({
      where: { userId },
      select: { 
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
            }
          }
        } 
      }
    });
    for (const m of customMemberships) {
      groups.push(m.group);
    }

    const groupIds = groups.map(g => g.id);
    const directGroupIds = groups.filter(g => g.type === 'DIRECT').map(g => g.id);
    const deptIds = groups.filter(g => g.type === 'DEPARTMENT' && g.departmentId).map(g => g.departmentId!);

    const [unreadCountByGroup, latestMessages, directMembers, deptMembers] = await Promise.all([
      this.getUnreadCounts(groupIds, userId),
      groupIds.length > 0 ? this.prisma.chatMessage.findMany({
        where: { groupId: { in: groupIds } },
        orderBy: [{ groupId: 'asc' }, { createdAt: 'desc' }],
        distinct: ['groupId'],
        include: { sender: { select: { profile: { select: { fullName: true } } } } }
      }) : [],
      directGroupIds.length > 0 ? this.prisma.chatGroupMember.findMany({
        where: { groupId: { in: directGroupIds }, userId: { not: userId } },
        include: { user: { select: { userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
      }) : [],
      deptIds.length > 0 ? this.prisma.departmentMember.findMany({
        where: { departmentId: { in: deptIds }, leftAt: null },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } }
            }
          }
        }
      }) : []
    ]);

    const latestMessageMap = Object.fromEntries(latestMessages.map(m => [m.groupId, m]));
    const directMemberMap = Object.fromEntries(directMembers.map(m => [m.groupId, m]));
    const deptMemberMap: Record<string, any[]> = {};
    for (const dm of deptMembers) {
      if (!deptMemberMap[dm.departmentId]) {
        deptMemberMap[dm.departmentId] = [];
      }
      deptMemberMap[dm.departmentId].push({
        userId: dm.userId,
        user: dm.user
      });
    }

    const resultGroups = [];
    for (const group of groups) {
      const latestMessage = latestMessageMap[group.id];

      let finalName = group.name;
      let otherUserId: string | undefined;
      let otherUserAvatar: string | undefined;
      let members = (group as any).members;

      if (group.type === 'DEPARTMENT' && group.departmentId) {
        members = deptMemberMap[group.departmentId] || [];
      }

      if (group.type === 'DIRECT') {
        const otherMember = directMemberMap[group.id];
        if (otherMember?.user) {
          finalName = otherMember.user.profile?.fullName || otherMember.user.userCode || 'Người dùng';
          otherUserId = otherMember.userId;
          otherUserAvatar = otherMember.user.profile?.avatarUrl ?? undefined;
        }
      }

      resultGroups.push({
        ...group,
        members,
        name: finalName,
        otherUserId,
        otherUserAvatar,
        latestMessage,
        unreadCount: unreadCountByGroup[group.id] || 0
      });
    }

    return resultGroups;
  }

  async getGroupMembers(groupId: string, actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userCode: true,
                profile: { select: { fullName: true, avatarUrl: true } }
              }
            }
          }
        }
      }
    });
    if (!group) throw new NotFoundException('Chat group not found');

    if (group.type === 'DEPARTMENT' && group.departmentId) {
      const deptMembers = await this.prisma.departmentMember.findMany({
        where: { departmentId: group.departmentId, leftAt: null },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } }
            }
          }
        }
      });
      return deptMembers.map(dm => ({
        id: dm.userId,
        userId: dm.userId,
        userCode: dm.user?.userCode || '',
        fullName: dm.user?.profile?.fullName || dm.user?.userCode || 'Thành viên',
        avatarUrl: dm.user?.profile?.avatarUrl || null,
        user: dm.user,
      }));
    }

    return (group.members || []).map(m => ({
      id: m.userId,
      userId: m.userId,
      userCode: m.user?.userCode || '',
      fullName: m.user?.profile?.fullName || m.user?.userCode || 'Thành viên',
      avatarUrl: m.user?.profile?.avatarUrl || null,
      user: m.user,
    }));
  }

  async createTaskGroup(taskId: string, name: string, memberIds: string[]) {
    return this.prisma.chatGroup.create({
      data: {
        taskId,
        name,
        type: 'TASK',
        members: {
          create: memberIds.map(userId => ({ userId }))
        }
      }
    });
  }

  async createDirectChat(userId1: string, userId2: string) {
    // Check if direct chat already exists
    const existingGroups = await this.prisma.chatGroup.findMany({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: { in: [userId1, userId2] }
          }
        }
      },
      include: {
        members: true
      }
    });

    // We must ensure the group has EXACTLY these 2 members
    const group = existingGroups.find(g => g.members.length === 2);
    if (group) return group;

    // Create new direct chat
    return this.prisma.chatGroup.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: userId1 }, { userId: userId2 }]
        }
      }
    });
  }

  async createCustomGroup(creatorId: string, name: string, memberIds: string[]) {
    const allMembers = Array.from(new Set([creatorId, ...memberIds]));
    return this.prisma.chatGroup.create({
      data: {
        name,
        type: 'CUSTOM',
        members: {
          create: allMembers.map(userId => ({ userId }))
        }
      }
    });
  }

  async getAllGroups(actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser, search?: string) {
    const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
    
    // Nếu là Global Admin (visibleDepts = null), xem mọi nhóm.
    // Nếu là Regional Admin (visibleDepts != null), xem nhóm CUSTOM/TASK, và chỉ DEPARTMENT thuộc miền.
    const groupTypesFilter: any[] = [];
    
    if (visibleDepts === null) {
      groupTypesFilter.push({ type: { in: ['DEPARTMENT', 'TASK', 'CUSTOM'] } });
    } else {
      groupTypesFilter.push({ type: { in: ['TASK', 'CUSTOM'] } });
      if (visibleDepts.length > 0) {
        groupTypesFilter.push({ type: 'DEPARTMENT', departmentId: { in: visibleDepts } });
      }
    }

    const groups = await this.prisma.chatGroup.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { department: { name: { contains: search, mode: 'insensitive' } } }
            ]
          } : {},
          {
            OR: [
              ...groupTypesFilter,
              { members: { some: { userId: actor.userId } } }
            ]
          }
        ]
      },
      include: {
        department: { select: { name: true } },
        task: { select: { title: true } },
        _count: { select: { members: true, messages: true } },
        members: {
          include: { user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Batch fetch department members for department groups
    const deptIds = groups.filter(g => g.type === 'DEPARTMENT' && g.departmentId).map(g => g.departmentId!);
    const deptMembers = deptIds.length > 0 ? await this.prisma.departmentMember.findMany({
      where: { departmentId: { in: deptIds }, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            profile: { select: { fullName: true, avatarUrl: true } }
          }
        }
      }
    }) : [];
    const deptMemberMap: Record<string, any[]> = {};
    for (const dm of deptMembers) {
      if (!deptMemberMap[dm.departmentId]) {
        deptMemberMap[dm.departmentId] = [];
      }
      deptMemberMap[dm.departmentId].push({
        userId: dm.userId,
        user: dm.user
      });
    }

    const groupIds = groups.map(g => g.id);
    const [unreadCountByGroup, latestMessages] = await Promise.all([
      this.getUnreadCounts(groupIds, actor.userId),
      groupIds.length > 0 ? this.prisma.chatMessage.findMany({
        where: { groupId: { in: groupIds } },
        orderBy: [{ groupId: 'asc' }, { createdAt: 'desc' }],
        distinct: ['groupId'],
        include: {
          sender: {
            select: {
              id: true,
              userCode: true,
              profile: { select: { fullName: true, avatarUrl: true } }
            }
          }
        }
      }) : []
    ]);
    const latestMessageMap = Object.fromEntries(latestMessages.map(m => [m.groupId, m]));

    const resultGroups = [];
    for (const group of groups) {
      const latestMessage = latestMessageMap[group.id];

      let finalName = group.name;
      let otherUserId: string | undefined;
      let otherUserAvatar: string | undefined;
      let members = (group as any).members;

      if (group.type === 'DEPARTMENT' && group.departmentId) {
        members = deptMemberMap[group.departmentId] || [];
      }

      if (group.type === 'DIRECT' && group.members?.length === 2) {
        const otherMember = group.members.find((m: any) => m.userId !== actor.userId) || group.members[0];
        if (otherMember?.user) {
          finalName = otherMember.user.profile?.fullName || otherMember.user.userCode || 'Người dùng';
          otherUserId = otherMember.userId;
          otherUserAvatar = otherMember.user.profile?.avatarUrl ?? undefined;
        }
      } else if (group.type === 'DEPARTMENT' && group.department?.name) {
        finalName = group.department.name;
      } else if (group.type === 'TASK' && group.task?.title) {
        finalName = group.task.title;
      }

      resultGroups.push({
        ...group,
        members,
        name: finalName,
        otherUserId,
        otherUserAvatar,
        latestMessage,
        unreadCount: unreadCountByGroup[group.id] || 0
      });
    }

    return resultGroups;
  }

  async markGroupAsRead(groupId: string, userId: string) {
    const unreadChatNotifications = await this.prisma.notificationTarget.findMany({
      where: {
        userId,
        readAt: null,
        notification: { type: 'CHAT_MESSAGE' }
      },
      include: { notification: { select: { id: true, metadata: true } } }
    });

    const targetIdsToUpdate: string[] = [];
    for (const target of unreadChatNotifications) {
      const metadata = target.notification.metadata as any;
      if (metadata && metadata.groupId === groupId) {
        targetIdsToUpdate.push(target.id);
      }
    }

    if (targetIdsToUpdate.length > 0) {
      await this.prisma.notificationTarget.updateMany({
        where: { id: { in: targetIdsToUpdate } },
        data: { readAt: new Date() }
      });
    }

    // Update lastReadAt on ChatGroupMember (upsert to handle users who are viewing without explicit ChatGroupMember record)
    await this.prisma.chatGroupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() }
    });

    this.realtime.emitToRoom(`group:${groupId}`, 'chat:group_read', { groupId, userId, readAt: new Date() });

    return { success: true, markedCount: targetIdsToUpdate.length };
  }

  async deleteGroup(groupId: string, actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const userId = actor.userId;
    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    
    if (!group) throw new NotFoundException('Chat group not found');

    const isMember = group.members.some(m => m.userId === userId);

    const isGlobalAdmin = actor.roles.includes('ADMIN') && (await this.scopes.getVisibleDepartmentIds(actor)) === null;
    const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor) ?? [];
    const isRegionalAdminWithAccess = group.type === 'DEPARTMENT' && group.departmentId && visibleDepts.includes(group.departmentId);
    
    const hasAdminAccess = isGlobalAdmin || !!isRegionalAdminWithAccess;

    if (!hasAdminAccess && !isMember) {
      throw new ForbiddenException('You do not have permission to delete this group');
    }

    if (!hasAdminAccess && group.type !== 'DIRECT') {
      throw new ForbiddenException('Only admin can delete non-direct chat groups');
    }

    await this.prisma.$transaction(async (tx) => {
      if (hasAdminAccess) {
        await tx.chatGroup.delete({ where: { id: groupId } });
      } else {
        await tx.chatGroupMember.delete({ where: { groupId_userId: { groupId, userId } } });
        const remaining = await tx.chatGroupMember.count({ where: { groupId } });
        if (remaining === 0) {
          await tx.chatGroup.delete({ where: { id: groupId } });
        }
      }
    });

    return { success: true };
  }

  async deleteMessage(groupId: string, messageId: string, actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const userId = actor.userId;
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { group: true }
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.groupId !== groupId) throw new ForbiddenException('Message does not belong to this group');

    const group = message.group;
    const isGlobalAdmin = actor.roles.includes('ADMIN') && (await this.scopes.getVisibleDepartmentIds(actor)) === null;
    const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor) ?? [];
    const isRegionalAdminWithAccess = group.type === 'DEPARTMENT' && group.departmentId && visibleDepts.includes(group.departmentId);
    
    const hasAdminAccess = isGlobalAdmin || !!isRegionalAdminWithAccess;

    if (message.senderId !== userId && !hasAdminAccess) {
      throw new ForbiddenException('You can only recall your own messages');
    }

    // Nếu có file đính kèm, cần xóa trên storage
    if (message.fileUrl && !message.content?.startsWith('LOTTIE_STICKER:') && !message.content?.startsWith('STATIC_STICKER:') && !message.content?.startsWith('GIPHY_STICKER:')) {
      const storageKey = this.storage.extractKeyFromUrl(message.fileUrl);
      if (storageKey) {
        await this.storage.delete(storageKey);
      }
    }

    const updatedMessage = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: 'Tin nhắn đã bị thu hồi',
        fileUrl: null,
        fileType: null,
        fileName: null,
      },
      include: {
        sender: { select: { id: true, userCode: true, roles: { include: { role: true } }, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });

    // Phát tín hiệu WebSocket tức thì cho các thành viên trong nhóm
    this.realtime.emitToRoom(`group:${groupId}`, 'chat:message_recalled', { groupId, messageId, message: updatedMessage });
    this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', updatedMessage);

    return { success: true, message: updatedMessage };
  }

  async reactToMessage(groupId: string, messageId: string, emoji: string, actor: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const userId = actor.userId;
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { group: true }
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.groupId !== groupId) throw new ForbiddenException('Message does not belong to this group');

    let currentReactions: Record<string, string> = {};
    if (message.reactions && typeof message.reactions === 'object') {
      currentReactions = { ...(message.reactions as Record<string, string>) };
    }

    // Toggle logic: if user clicked the same emoji -> remove it. Otherwise, set emoji.
    if (currentReactions[userId] === emoji) {
      delete currentReactions[userId];
    } else {
      currentReactions[userId] = emoji;
    }

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        reactions: currentReactions
      }
    });

    // Realtime broadcast to all group members
    this.realtime.emitToRoom(`group:${groupId}`, 'chat:message_reacted', {
      groupId,
      messageId,
      userId,
      emoji,
      reactions: currentReactions
    });

    return { success: true, reactions: currentReactions };
  }

  async getMessageReactionDetails(groupId: string, messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, groupId: true, reactions: true }
    });
    if (!message || message.groupId !== groupId) throw new NotFoundException('Message not found');

    const reactionsMap = (message.reactions as Record<string, string>) || {};
    const userIds = Object.keys(reactionsMap);
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        userCode: true,
        profile: { select: { fullName: true, avatarUrl: true } }
      }
    });

    return users.map(u => ({
      user: {
        id: u.id,
        userCode: u.userCode,
        fullName: u.profile?.fullName || u.userCode,
        avatarUrl: u.profile?.avatarUrl
      },
      emoji: reactionsMap[u.id]
    }));
  }

  async getMessageSeenDetails(groupId: string, messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, groupId: true, createdAt: true }
    });
    if (!message || message.groupId !== groupId) throw new NotFoundException('Message not found');

    // Get group members who read messages on or after this message's createdAt
    const members = await this.prisma.chatGroupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            profile: { select: { fullName: true, avatarUrl: true } }
          }
        }
      }
    });

    return members
      .filter(m => m.lastReadAt && new Date(m.lastReadAt) >= new Date(message.createdAt))
      .map(m => ({
        user: {
          id: m.user.id,
          userCode: m.user.userCode,
          fullName: m.user.profile?.fullName || m.user.userCode,
          avatarUrl: m.user.profile?.avatarUrl
        },
        readAt: m.lastReadAt
      }));
  }
}
