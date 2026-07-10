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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const realtime_events_service_1 = require("../realtime/realtime-events.service");
let ChatService = class ChatService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async getGroupForDepartment(departmentId) {
        let group = await this.prisma.chatGroup.findUnique({
            where: { departmentId }
        });
        if (!group) {
            const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
            if (!dept)
                throw new common_1.NotFoundException('Department not found');
            group = await this.prisma.chatGroup.create({
                data: {
                    departmentId,
                    name: `Nhóm ${dept.name}`
                }
            });
        }
        return group;
    }
    async getMessages(groupId, skip = 0, take = 50) {
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
    async sendMessage(userId, groupId, dto) {
        const group = await this.prisma.chatGroup.findUnique({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Chat group not found');
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
                sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
            }
        });
        if (group.departmentId) {
            this.realtime.emitToDepartment(group.departmentId, 'chat:message', message);
        }
        else {
            this.realtime.emitToRoom(`group:${groupId}`, 'chat:message', message);
        }
        return message;
    }
    async getMyGroups(userId) {
        const memberships = await this.prisma.departmentMember.findMany({
            where: { userId, leftAt: null },
            select: { departmentId: true, department: { select: { name: true } } }
        });
        const groups = [];
        for (const m of memberships) {
            const group = await this.getGroupForDepartment(m.departmentId);
            groups.push(group);
        }
        const customMemberships = await this.prisma.chatGroupMember.findMany({
            where: { userId },
            select: { group: true }
        });
        for (const m of customMemberships) {
            groups.push(m.group);
        }
        const resultGroups = [];
        for (const group of groups) {
            const latestMessage = await this.prisma.chatMessage.findFirst({
                where: { groupId: group.id },
                orderBy: { createdAt: 'desc' },
                include: { sender: { select: { profile: { select: { fullName: true } } } } }
            });
            let finalName = group.name;
            if (group.type === 'DIRECT') {
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
                latestMessage
            });
        }
        return resultGroups;
    }
    async createTaskGroup(taskId, name, memberIds) {
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
    async createDirectChat(userId1, userId2) {
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
        const group = existingGroups.find(g => g.members.length === 2);
        if (group)
            return group;
        return this.prisma.chatGroup.create({
            data: {
                type: 'DIRECT',
                members: {
                    create: [{ userId: userId1 }, { userId: userId2 }]
                }
            }
        });
    }
    async createCustomGroup(creatorId, name, memberIds) {
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
    async getAllGroups(search) {
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_events_service_1.RealtimeEventsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map