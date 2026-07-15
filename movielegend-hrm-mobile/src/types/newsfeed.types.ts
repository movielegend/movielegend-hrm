export interface NewsfeedPostDto {
  id: string;
  title: string | null;
  content: string;
  images: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  author: {
    id: string;
    userCode: string;
    profile?: { fullName: string } | null;
  };
  department?: { id: string; name: string } | null;
  comments: PostCommentDto[];
  likes: PostLikeDto[];
  _count?: { comments: number; likes: number };
}

export interface PostCommentDto {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    userCode: string;
    profile?: { fullName: string } | null;
  };
}

export interface PostLikeDto {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface CreateNewsfeedPostPayload {
  title?: string;
  content: string;
  departmentId?: string;
}

export interface CreateCommentPayload {
  content: string;
}
