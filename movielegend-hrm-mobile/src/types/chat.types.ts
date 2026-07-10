export type ChatGroupType = 'DEPARTMENT' | 'TASK';

export interface ChatGroupDto {
  id: string;
  name: string | null;
  type: ChatGroupType;
  departmentId: string | null;
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
  members: ChatGroupMemberDto[];
  _count?: { members: number; messages: number };
}

export interface ChatGroupMemberDto {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
  user?: {
    id: string;
    userCode: string;
    profile?: { fullName: string } | null;
  };
}

export interface ChatMessageDto {
  id: string;
  groupId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    userCode: string;
    profile?: { fullName: string } | null;
  };
}

export interface CreateChatMessagePayload {
  content: string;
}
