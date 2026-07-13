import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getMyGroups(user: AuthenticatedUser): Promise<{
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
    sendMessage(groupId: string, dto: CreateChatMessageDto, user: AuthenticatedUser): Promise<{
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
    createDirectChat(user: AuthenticatedUser, targetUserId: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }>;
    createCustomGroup(user: AuthenticatedUser, name: string, memberIds: string[]): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        type: import("@prisma/client").$Enums.ChatGroupType;
        taskId: string | null;
        isArchived: boolean;
    }>;
}
