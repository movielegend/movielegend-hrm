export declare class CreateCrossDepartmentRequestDto {
    sourceDepartmentId: string;
    targetDepartmentId: string;
    taskId?: string;
    title: string;
    content: string;
}
export declare class RejectCrossDepartmentRequestDto {
    reason: string;
}
