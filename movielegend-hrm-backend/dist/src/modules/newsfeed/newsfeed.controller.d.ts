import { NewsfeedService } from './newsfeed.service';
import { CreateNewsfeedPostDto, CreateCommentDto } from './dto/newsfeed.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class NewsfeedController {
    private readonly newsfeedService;
    constructor(newsfeedService: NewsfeedService);
    createPost(dto: CreateNewsfeedPostDto, user: AuthenticatedUser): Promise<{
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
    }>;
    likePost(id: string, user: AuthenticatedUser): Promise<{
        liked: boolean;
    }>;
    addComment(id: string, dto: CreateCommentDto, user: AuthenticatedUser): Promise<{
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
}
