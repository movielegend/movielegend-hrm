import type { PaginatedResult } from './pagination.types';

export interface PaginatedQuery {
  page?: number;
  limit?: number;
}

export type FeedbackStatus = 'SEND' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

export interface FeedbackSender {
  id: string;
  userCode: string;
  fullName: string | null;
  email?: string;
  phone?: string;
}

export interface Feedback {
  id: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: FeedbackStatus;
  reason: string | null;
  img: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  sender?: FeedbackSender | null;
  senderDisplayName?: string;
}

export interface FeedbackQuery extends PaginatedQuery {
  status?: FeedbackStatus;
  isAnonymous?: boolean;
  search?: string;
}

export interface CreateFeedbackDto {
  title: string;
  content: string;
  isAnonymous: boolean;
  img?: string;
}

export interface UpdateFeedbackStatusDto {
  status: FeedbackStatus;
  reason?: string;
}

export interface FeedbackStats {
  total: number;
  byStatus: Record<FeedbackStatus, number>;
  anonymous: number;
  nonAnonymous: number;
}

export type FeedbackListResponse = PaginatedResult<Feedback>;
