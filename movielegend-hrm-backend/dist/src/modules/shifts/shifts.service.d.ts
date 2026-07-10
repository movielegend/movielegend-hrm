import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';
export declare class ShiftsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateShiftDto): import("@prisma/client").Prisma.Prisma__ShiftClient<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        assignments: ({
            user: {
                profile: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    fullName: string;
                    positionId: string | null;
                    dateOfBirth: Date | null;
                    gender: import("@prisma/client").$Enums.Gender | null;
                    idCardNumber: string;
                    idCardIssueDate: Date | null;
                    idCardIssuePlace: string | null;
                    idCardFrontUrl: string | null;
                    idCardBackUrl: string | null;
                    permanentAddress: string | null;
                    temporaryAddress: string | null;
                    avatarUrl: string | null;
                    joinDate: Date | null;
                    officialDate: Date | null;
                    employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                    emergencyContactName: string | null;
                    emergencyContactPhone: string | null;
                } | null;
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                userCode: string;
                phone: string;
                email: string | null;
                passwordHash: string;
                accountStatus: import("@prisma/client").$Enums.AccountStatus;
                approvalStatus: import("@prisma/client").$Enums.ApprovalStatus;
                lastLoginAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            workDate: Date;
            shiftId: string;
            assignedByUserId: string | null;
        })[];
    } & {
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    })[]>;
    update(id: string, dto: UpdateShiftDto): import("@prisma/client").Prisma.Prisma__ShiftClient<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    } | undefined>;
    deleteAllAssignments(): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
