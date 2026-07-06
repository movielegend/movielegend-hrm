import { AccountStatus } from '@prisma/client';
export declare class UpdateUserDto {
    fullName?: string;
    phone?: string;
    email?: string;
    departmentId?: string;
    positionId?: string;
    accountStatus?: AccountStatus;
    isActive?: boolean;
}
