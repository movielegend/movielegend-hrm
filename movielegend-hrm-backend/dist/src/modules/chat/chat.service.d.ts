import { PrismaService } from '../../database/prisma.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
export declare class ChatService {
    private prisma;
    private realtime;
    constructor(prisma: PrismaService, realtime: RealtimeEventsService);
    getGroupForDepartment(departmentId: string): Promise<any>;
    getMessages(groupId: string, skip?: number, take?: number): Promise<any>;
    sendMessage(userId: string, groupId: string, dto: CreateChatMessageDto): Promise<any>;
    getMyGroups(userId: string): Promise<any[]>;
    createTaskGroup(taskId: string, name: string, memberIds: string[]): Promise<any>;
}
