import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    
    if (member) {
      if (member.clearedAt) {
        whereClause.createdAt = { gt: member.clearedAt };
      } else {
        whereClause.createdAt = { gte: member.joinedAt };
      }
    }

    return this.prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
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
        content: dto.content,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileName: dto.fileName,
        mentions: dto.mentions ?? []
      },
      include: {
        sender: { select: { id: true, userCode: true, roles: { include: { role: true } }, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });

    const isAdmin = message.sender?.roles?.some((r: any) => r.role?.code?.toUpperCase().includes('ADMIN'));
    const senderName = isAdmin ? 'Admin' : (message.sender?.profile?.fullName ?? message.sender.userCode);

    // Phát tín hiệu qua WebSocket duy nhất tới phòng chat và các thành viên
    this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', message);
    if (group.members && group.members.length > 0) {
      for (const m of group.members) {
        if (m.userId !== userId) {
          this.realtime.emitToUser(m.userId, 'chat:message', message);
        }
      }
    }

    // Xử lý tạo thông báo (Notification) ngầm non-blocking trong background
    setImmediate(async () => {
      try {
        if (group.departmentId) {
          const members = await this.prisma.departmentMember.findMany({
            where: { departmentId: group.departmentId, leftAt: null },
            select: { userId: true }
          });

          const notifyMembers = members.filter(m => m.userId !== userId);
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
            this.realtime.emitToUser(m.userId, 'chat:message', message);
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
        console.error('[ChatService] Background notification error:', err);
      }
    });

    return message;
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

    const unreadChatNotifications = await this.prisma.notificationTarget.findMany({
      where: {
        userId,
        readAt: null,
        notification: { type: 'CHAT_MESSAGE' }
      },
      include: { notification: { select: { metadata: true } } }
    });

    const unreadCountByGroup: Record<string, number> = {};
    for (const target of unreadChatNotifications) {
      const metadata = target.notification.metadata as any;
      if (metadata && metadata.groupId) {
        const groupId = metadata.groupId;
        unreadCountByGroup[groupId] = (unreadCountByGroup[groupId] || 0) + 1;
      }
    }

    // 1. Batch fetch latest messages for all groups
    const groupIds = groups.map(g => g.id);
    const latestMessages = await this.prisma.chatMessage.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: [{ groupId: 'asc' }, { createdAt: 'desc' }],
      distinct: ['groupId'],
      include: { sender: { select: { profile: { select: { fullName: true } } } } }
    });
    const latestMessageMap = Object.fromEntries(latestMessages.map(m => [m.groupId, m]));

    // 2. Batch fetch direct group other members
    const directGroupIds = groups.filter(g => g.type === 'DIRECT').map(g => g.id);
    const directMembers = await this.prisma.chatGroupMember.findMany({
      where: { groupId: { in: directGroupIds }, userId: { not: userId } },
      include: { user: { select: { userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
    });
    const directMemberMap = Object.fromEntries(directMembers.map(m => [m.groupId, m]));

    const resultGroups = [];
    for (const group of groups) {
      const latestMessage = latestMessageMap[group.id];

      let finalName = group.name;
      let otherUserId: string | undefined;
      let otherUserAvatar: string | undefined;

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
        name: finalName,
        otherUserId,
        otherUserAvatar,
        latestMessage,
        unreadCount: unreadCountByGroup[group.id] || 0
      });
    }

    return resultGroups;
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

    const resultGroups = [];
    for (const group of groups) {
      // Lấy tin nhắn mới nhất cho mỗi nhóm
      const latestMessage = await this.prisma.chatMessage.findFirst({
        where: { groupId: group.id },
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { profile: { select: { fullName: true } } } } }
      });

      let finalName = group.name;
      if (group.type === 'DIRECT' && group.members?.length === 2) {
        const u1 = group.members[0].user;
        const name1 = u1?.profile?.fullName || u1?.userCode || 'Người dùng';
        const u2 = group.members[1].user;
        const name2 = u2?.profile?.fullName || u2?.userCode || 'Người dùng';
        finalName = `${name1} - ${name2}`;
      } else if (group.type === 'DEPARTMENT' && group.department?.name) {
        finalName = group.department.name;
      } else if (group.type === 'TASK' && group.task?.title) {
        finalName = group.task.title;
      }

      resultGroups.push({
        ...group,
        name: finalName,
        latestMessage,
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
}
