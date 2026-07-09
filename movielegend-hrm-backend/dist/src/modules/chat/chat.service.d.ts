import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
export declare class ChatService {
    private prisma;
    private realtime;
    constructor(prisma: PrismaService, realtime: RealtimeEventsService);
    getGroupForDepartment(departmentId: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ChatGroupType;
        departmentId: string | null;
        taskId: string | null;
    }>;
    getMessages(groupId: string, skip?: number, take?: number): Promise<({
        sender: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        groupId: string;
        senderId: string;
    })[]>;
    sendMessage(userId: string, groupId: string, dto: CreateChatMessageDto): Promise<{
        sender: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        groupId: string;
        senderId: string;
    }>;
    getMyGroups(userId: string): Promise<{
        latestMessage: ({
            sender: {
                profile: {
                    fullName: string;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            groupId: string;
            senderId: string;
        }) | null;
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ChatGroupType;
        departmentId: string | null;
        taskId: string | null;
    }[]>;
    createTaskGroup(taskId: string, name: string, memberIds: string[]): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.ChatGroupType;
        departmentId: string | null;
        taskId: string | null;
    }>;
}
