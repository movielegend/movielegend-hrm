import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
    private readonly notifications: NotificationsService
  ) {}

  // Get or Create group for a department
  async getGroupForDepartment(departmentId: string) {
    let group = await this.prisma.chatGroup.findUnique({
      where: { departmentId }
    });

    if (!group) {
      const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) throw new NotFoundException('Department not found');

      group = await this.prisma.chatGroup.create({
        data: {
          departmentId,
          name: `Nhóm ${dept.name}`
        }
      });
    }

    return group;
  }

  async getMessages(groupId: string, skip: number = 0, take: number = 50) {
    return this.prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });
  }

  async sendMessage(userId: string, groupId: string, dto: CreateChatMessageDto) {
    const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Chat group not found');

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
        where: { departmentId: group.departmentId, leftAt: null, userId: { not: userId } },
        select: { userId: true }
      });
      if (members.length > 0) {
        await this.prisma.$transaction(async (tx) => {
          const notificationBody = message.content?.startsWith('GIPHY_STICKER:') || message.content?.startsWith('LOTTIE_STICKER:') || message.content?.startsWith('STATIC_STICKER:')
            ? '[Nhãn dán]'
            : message.content ?? (message.fileType === 'IMAGE' ? '[Hình ảnh]' : '[Tệp tin đính kèm]');

          const payload = await this.notifications.createForUsers(
            tx as any,
            members.map(m => m.userId),
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
                title: `Tin nhắn mới từ ${senderName} (Nhóm: ${group.name || 'Cá nhân'})`,
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
      select: { group: true }
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

    const resultGroups = [];
    for (const group of groups) {
      // Fetch latest message
      const latestMessage = await this.prisma.chatMessage.findFirst({
        where: { groupId: group.id },
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { profile: { select: { fullName: true } } } } }
      });

      let finalName = group.name;
      if (group.type === 'DIRECT') {
        // Find the other member to use as group name
        const otherMember = await this.prisma.chatGroupMember.findFirst({
          where: { groupId: group.id, userId: { not: userId } },
          include: { user: { select: { profile: { select: { fullName: true } } } } }
        });
        if (otherMember?.user?.profile?.fullName) {
          finalName = otherMember.user.profile.fullName;
        }
      }

      resultGroups.push({
        ...group,
        name: finalName,
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

  async getAllGroups(search?: string) {
    return this.prisma.chatGroup.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { department: { name: { contains: search, mode: 'insensitive' } } }
        ]
      } : {},
      include: {
        department: { select: { name: true } },
        task: { select: { title: true } },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
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
}

