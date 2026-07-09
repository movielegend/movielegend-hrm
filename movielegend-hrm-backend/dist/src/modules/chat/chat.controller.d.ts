import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getMyGroups(user: AuthenticatedUser): Promise<{
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
        departmentId: string | null;
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
        content: string;
        groupId: string;
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
        content: string;
        groupId: string;
        senderId: string;
    }>;
}
