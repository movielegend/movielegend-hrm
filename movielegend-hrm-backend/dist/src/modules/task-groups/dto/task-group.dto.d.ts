export declare class TaskGroupQueryDto {
    search?: string;
    departmentId?: string;
    isActive?: boolean;
    page: number;
    limit: number;
}
export declare class CreateTaskGroupDto {
    departmentId: string;
    name: string;
    description?: string;
}
export declare class AddTaskGroupMemberDto {
    userId: string;
}
