import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getMyGroups(user: AuthenticatedUser): Promise<any[]>;
    getMessages(groupId: string, skip?: number, take?: number): Promise<any>;
    sendMessage(groupId: string, dto: CreateChatMessageDto, user: AuthenticatedUser): Promise<any>;
}
