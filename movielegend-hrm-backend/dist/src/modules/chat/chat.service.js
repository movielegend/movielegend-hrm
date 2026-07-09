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
                content: dto.content
            },
            include: {
                sender: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
            }
        });
        if (group.departmentId) {
            this.realtime.emitToDepartment(group.departmentId, 'chat:message', message);
        }
        return message;
    }
    async getMyGroups(userId) {
        const memberships = await this.prisma.departmentMember.findMany({
            where: { userId },
            select: { departmentId: true, department: { select: { name: true } } }
        });
        const groups = [];
        for (const m of memberships) {
            const group = await this.getGroupForDepartment(m.departmentId);
            const latestMessage = await this.prisma.chatMessage.findFirst({
                where: { groupId: group.id },
                orderBy: { createdAt: 'desc' },
                include: { sender: { select: { profile: { select: { fullName: true } } } } }
            });
            groups.push({
                ...group,
                latestMessage
            });
        }
        return groups;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_events_service_1.RealtimeEventsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map