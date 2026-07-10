import { PrismaService } from '../../database/prisma.service';
import { CreateNewsfeedPostDto, CreateCommentDto } from './dto/newsfeed.dto';
export declare class NewsfeedService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(userId: string, dto: CreateNewsfeedPostDto): Promise<{
        author: {
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
        title: string | null;
        departmentId: string | null;
        images: string[];
        content: string;
        attachments: string[];
        authorId: string;
    }>;
    getPosts(departmentId?: string): Promise<({
        _count: {
            comments: number;
            likes: number;
        };
        author: {
            id: string;
            userCode: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
        likes: {
            userId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        departmentId: string | null;
        images: string[];
        content: string;
        attachments: string[];
        authorId: string;
    })[]>;
    getPostById(id: string): Promise<{
        _count: {
            comments: number;
            likes: number;
        };
        comments: ({
            author: {
                id: string;
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
            authorId: string;
            postId: string;
        })[];
        author: {
            id: string;
            profile: {
                fullName: string;
                avatarUrl: string | null;
            } | null;
        };
        likes: ({
            user: {
                id: string;
                profile: {
                    fullName: string;
                    avatarUrl: string | null;
                } | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            postId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        departmentId: string | null;
        images: string[];
        content: string;
        attachments: string[];
        authorId: string;
    }>;
    likePost(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    addComment(userId: string, postId: string, dto: CreateCommentDto): Promise<{
        author: {
            id: string;
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
        authorId: string;
        postId: string;
    }>;
    deletePost(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        departmentId: string | null;
        images: string[];
        content: string;
        attachments: string[];
        authorId: string;
    }>;
}
