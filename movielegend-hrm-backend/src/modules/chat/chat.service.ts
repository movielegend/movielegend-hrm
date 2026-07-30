import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService
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

  async getMessages(groupId: string, userId: string, isAdmin: boolean = false, skip: number = 0, take: number = 50) {
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
      
      if (!isAdmin) {
        if (group.type === 'CUSTOM' || group.type === 'TASK') {
          throw new ForbiddenException('You do not have permission to read this chat');
        }
        if (group.type === 'DEPARTMENT' && group.departmentId) {
          const deptMember = await this.prisma.departmentMember.findUnique({
            where: { departmentId_userId: { userId, departmentId: group.departmentId } }
          });
          if (!deptMember || deptMember.leftAt) {
            throw new ForbiddenException('You do not have permission to read this chat');
          }
        }
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

  async sendMessage(userId: string, groupId: string, dto: CreateChatMessageDto) {
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Chat group not found');

    const senderUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
    const isAdminUser = senderUser?.roles?.some(r => r.role?.code?.toUpperCase().includes('ADMIN'));

    const member = await this.prisma.chatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member && !isAdminUser) {
      if (group.type === 'DIRECT' || group.type === 'CUSTOM' || group.type === 'TASK') {
        throw new ForbiddenException('You do not have permission to send messages to this chat');
      }
      if (group.type === 'DEPARTMENT' && group.departmentId) {
        const deptMember = await this.prisma.departmentMember.findUnique({
          where: { departmentId_userId: { userId, departmentId: group.departmentId } }
        });
        if (!deptMember || deptMember.leftAt) {
          throw new ForbiddenException('You do not have permission to send messages to this chat');
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

    // Phát tín hiệu qua WebSocket cho tất cả user
    if (group.departmentId) {
      this.realtime.emitToDepartment(group.departmentId, 'chat:message', message);
      
      const members = await this.prisma.departmentMember.findMany({
        where: { departmentId: group.departmentId, leftAt: null },
        select: { userId: true }
      });
      for (const m of members) {
        this.realtime.emitToUser(m.userId, 'chat:message', message);
      }

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
      this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', message);
      
      const members = await this.prisma.chatGroupMember.findMany({
        where: { groupId }
      });
      for (const m of members) {
        this.realtime.emitToUser(m.userId, 'chat:message', message);
      }
      
      const otherMembers = members.filter(m => m.userId !== userId);
      console.log(`[ChatService] Sending message from ${userId} to groupId ${groupId}`);
      console.log(`[ChatService] Found ${members.length} members, otherMembers: ${otherMembers.length}`);
      
      if (otherMembers.length > 0) {
        try {
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
            console.log(`[ChatService] Notification created successfully:`, !!payload);
            if (payload) {
              this.notifications.emitCreated(payload);
              console.log(`[ChatService] Emitted notification.created to users`);
            }
          });
        } catch (error) {
          console.error(`[ChatService] Failed to create notification:`, error);
        }
      }
    }

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

  async getAllGroups(userId: string, search?: string) {
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
              { type: { in: ['DEPARTMENT', 'TASK', 'CUSTOM'] } },
              { members: { some: { userId } } }
            ]
          }
        ]
      },
      include: {
        department: { select: { name: true } },
        task: { select: { title: true } },
        _count: { select: { members: true, messages: true } },
        members: {
          include: { user: { select: { userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } } }
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

  async deleteGroup(groupId: string, userId: string, isAdmin: boolean) {
    const group = await this.prisma.chatGroup.findUnique({
      where: { id: groupId },
      include: { members: true }
    });
    
    if (!group) throw new NotFoundException('Chat group not found');

    const isMember = group.members.some(m => m.userId === userId);

    if (!isAdmin && !isMember) {
      throw new ForbiddenException('You do not have permission to delete this group');
    }

    if (!isAdmin && group.type !== 'DIRECT') {
      throw new ForbiddenException('Only admin can delete non-direct chat groups');
    }

    await this.prisma.$transaction(async (tx) => {
      if (isAdmin) {
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

  async deleteMessage(userId: string, groupId: string, messageId: string, isAdmin: boolean) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.groupId !== groupId) throw new ForbiddenException('Message does not belong to this group');

    if (message.senderId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only recall your own messages');
    }

    // Nếu có file đính kèm, cần xóa trên storage
    if (message.fileUrl && !message.content?.startsWith('LOTTIE_STICKER:') && !message.content?.startsWith('STATIC_STICKER:') && !message.content?.startsWith('GIPHY_STICKER:')) {
      const storageKey = this.storage.extractKeyFromUrl(message.fileUrl);
      if (storageKey) {
        await this.storage.delete(storageKey);
      }
    }

    await this.prisma.chatMessage.delete({ where: { id: messageId } });

    // Phát tín hiệu websocket bằng payload ảo để ứng dụng di động tự fetch lại tin nhắn mới nhất
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (group) {
      if (group.departmentId) {
        this.realtime.emitToDepartment(group.departmentId, 'chat:message', { groupId });
        const members = await this.prisma.departmentMember.findMany({
          where: { departmentId: group.departmentId, leftAt: null },
          select: { userId: true }
        });
        for (const m of members) {
          this.realtime.emitToUser(m.userId, 'chat:message', { groupId });
        }
      } else {
        this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', { groupId });
        const members = await this.prisma.chatGroupMember.findMany({
          where: { groupId }
        });
        for (const m of members) {
          this.realtime.emitToUser(m.userId, 'chat:message', { groupId });
        }
      }
    }

    return { success: true };
  }
}
