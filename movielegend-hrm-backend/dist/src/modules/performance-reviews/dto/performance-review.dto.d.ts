import { ReviewerType } from '@prisma/client';
export declare class CreateReviewCycleDto {
    companyId: string;
    code: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    selfReviewStart: string;
    selfReviewEnd: string;
    leaderReviewStart: string;
    leaderReviewEnd: string;
    finalReviewStart: string;
    finalReviewEnd: string;
}
export declare class AssignReviewerDto {
    employeeUserId: string;
    reviewerUserId: string;
    reviewerType: ReviewerType;
}
export declare class SubmitReviewDto {
    summary?: string;
    score?: number;
}
