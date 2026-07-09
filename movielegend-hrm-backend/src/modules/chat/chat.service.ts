import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeEventsService
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
        content: dto.content
      },
      include: {
        sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });

    // Phát tín hiệu qua WebSocket cho tất cả user
    if (group.departmentId) {
      this.realtime.emitToDepartment(group.departmentId, 'chat:message', message);
    } else {
      this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', message);
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

    const resultGroups = [];
    for (const group of groups) {
      // Fetch latest message
      const latestMessage = await this.prisma.chatMessage.findFirst({
        where: { groupId: group.id },
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { profile: { select: { fullName: true } } } } }
      });

      resultGroups.push({
        ...group,
        latestMessage
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
}

