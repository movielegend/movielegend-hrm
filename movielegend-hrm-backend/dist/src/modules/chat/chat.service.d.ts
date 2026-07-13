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
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
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
        fileUrl: string | null;
        fileName: string | null;
        content: string | null;
        groupId: string;
        fileType: string | null;
        mentions: string[];
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
        fileUrl: string | null;
        fileName: string | null;
        content: string | null;
        groupId: string;
        fileType: string | null;
        mentions: string[];
        senderId: string;
    }>;
    getMyGroups(userId: string): Promise<{
        name: string | null;
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
            fileUrl: string | null;
            fileName: string | null;
            content: string | null;
            groupId: string;
            fileType: string | null;
            mentions: string[];
            senderId: string;
        }) | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }[]>;
    createTaskGroup(taskId: string, name: string, memberIds: string[]): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }>;
    createDirectChat(userId1: string, userId2: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }>;
    createCustomGroup(creatorId: string, name: string, memberIds: string[]): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }>;
    getAllGroups(search?: string): Promise<({
        department: {
            name: string;
        } | null;
        _count: {
            members: number;
            messages: number;
        };
        task: {
            title: string;
        } | null;
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    })[]>;
}
