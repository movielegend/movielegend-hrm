import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto, CheckInDto, CheckOutDto, CreateAttendanceAdjustmentDto, CreateAttendanceLocationDto, CreateWifiConfigDto, TrackLocationDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(dto: CheckInDto, actor: AuthenticatedUser): Promise<{
        shiftAssignment: {
            department: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                leaderUserId: string | null;
            };
            shift: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            userId: string;
            shiftId: string;
            workDate: Date;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            assignedByUserId: string | null;
        };
        photoFile: {
            id: string;
            fileUrl: string;
            mimeType: string;
            size: number;
        } | null;
        verifications: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.AttendanceVerificationType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string | null;
            attendanceRecordId: string;
            success: boolean;
            score: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        adjustments: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
            reason: string;
            decidedAt: Date | null;
            requestedCheckInAt: Date | null;
            requestedCheckOutAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string;
        userId: string;
        workDate: Date;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        photoFileId: string | null;
        shiftAssignmentId: string;
        checkInAt: Date;
        checkOutAt: Date | null;
        checkInLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkInLongitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLongitude: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    checkOut(dto: CheckOutDto, actor: AuthenticatedUser): Promise<({
        shiftAssignment: {
            department: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                leaderUserId: string | null;
            };
            shift: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            userId: string;
            shiftId: string;
            workDate: Date;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            assignedByUserId: string | null;
        };
        photoFile: {
            id: string;
            fileUrl: string;
            mimeType: string;
            size: number;
        } | null;
        verifications: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.AttendanceVerificationType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            provider: string | null;
            attendanceRecordId: string;
            success: boolean;
            score: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        adjustments: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
            reason: string;
            decidedAt: Date | null;
            requestedCheckInAt: Date | null;
            requestedCheckOutAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string;
        userId: string;
        workDate: Date;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        photoFileId: string | null;
        shiftAssignmentId: string;
        checkInAt: Date;
        checkOutAt: Date | null;
        checkInLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkInLongitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLongitude: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    createAdjustment(dto: CreateAttendanceAdjustmentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string;
        userId: string;
        status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        attendanceRecordId: string | null;
        requestedCheckInAt: Date | null;
        requestedCheckOutAt: Date | null;
    }>;
    approveAdjustment(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string;
        userId: string;
        status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        attendanceRecordId: string | null;
        requestedCheckInAt: Date | null;
        requestedCheckOutAt: Date | null;
    }>;
    findAll(actor: AuthenticatedUser, departmentId?: string): Promise<({
        user: {
            id: string;
            email: string | null;
            phone: string;
            userCode: string;
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                fullName: string;
                dateOfBirth: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                idCardNumber: string;
                idCardIssueDate: Date | null;
                idCardIssuePlace: string | null;
                permanentAddress: string | null;
                temporaryAddress: string | null;
                avatarUrl: string | null;
                joinDate: Date | null;
                officialDate: Date | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                emergencyContactName: string | null;
                emergencyContactPhone: string | null;
                positionId: string | null;
                userId: string;
            } | null;
        };
        shiftAssignment: {
            shift: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            userId: string;
            shiftId: string;
            workDate: Date;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            assignedByUserId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string;
        userId: string;
        workDate: Date;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        photoFileId: string | null;
        shiftAssignmentId: string;
        checkInAt: Date;
        checkOutAt: Date | null;
        checkInLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkInLongitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLatitude: import("@prisma/client/runtime/library").Decimal | null;
        checkOutLongitude: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    current(actor: AuthenticatedUser): Promise<{
        state: string;
        attendance: null;
    } | {
        state: string;
        attendance: {
            id: string;
            userId: string;
            departmentId: string;
            shiftAssignmentId: string;
            workDate: Date;
            checkInAt: Date;
            checkOutAt: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            shiftAssignment: {
                department: {
                    id: string;
                    code: string;
                    name: string;
                    description: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    leaderUserId: string | null;
                };
                shift: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                departmentId: string;
                userId: string;
                shiftId: string;
                workDate: Date;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                assignedByUserId: string | null;
            };
            photo: {
                fileId: string;
                fileUrl: string;
            } | null;
        };
    }>;
    myHistory(actor: AuthenticatedUser, query: AttendanceQueryDto): Promise<{
        items: {
            id: string;
            userId: string;
            departmentId: string;
            shiftAssignmentId: string;
            workDate: Date;
            checkInAt: Date;
            checkOutAt: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            shiftAssignment: {
                department: {
                    id: string;
                    code: string;
                    name: string;
                    description: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    leaderUserId: string | null;
                };
                shift: {
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
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                departmentId: string;
                userId: string;
                shiftId: string;
                workDate: Date;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                assignedByUserId: string | null;
            };
            photo: {
                fileId: string;
                fileUrl: string;
            } | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    activeLocations(actor: AuthenticatedUser): Promise<{
        latitude: number;
        longitude: number;
        id: string;
        name: string;
        departmentId: string | null;
        radiusMeters: number;
    }[]>;
    detail(id: string, actor: AuthenticatedUser): Promise<{
        scheduledStartAt: Date;
        scheduledEndAt: Date;
        workedMinutes: number;
        lateMinutes: number;
        earlyLeaveMinutes: number;
        overtimeMinutes: number;
        gps: {
            checkInLatitude: import("@prisma/client/runtime/library").Decimal | null;
            checkInLongitude: import("@prisma/client/runtime/library").Decimal | null;
            checkOutLatitude: import("@prisma/client/runtime/library").Decimal | null;
            checkOutLongitude: import("@prisma/client/runtime/library").Decimal | null;
            attendanceLocation: {
                latitude: number;
                longitude: number;
                id: string;
                name: string;
                departmentId: string | null;
                radiusMeters: number;
            } | null;
        };
        adjustmentSummary: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
            requestedCheckInAt: Date | null;
            requestedCheckOutAt: Date | null;
            reason: string;
            decidedAt: Date | null;
        }[];
        id: string;
        userId: string;
        departmentId: string;
        shiftAssignmentId: string;
        workDate: Date;
        checkInAt: Date;
        checkOutAt: Date | null;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        shiftAssignment: {
            department: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                leaderUserId: string | null;
            };
            shift: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            userId: string;
            shiftId: string;
            workDate: Date;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            assignedByUserId: string | null;
        };
        photo: {
            fileId: string;
            fileUrl: string;
        } | null;
    }>;
    createLocation(dto: CreateAttendanceLocationDto): import("@prisma/client").Prisma.Prisma__AttendanceLocationClient<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    createWifi(dto: CreateWifiConfigDto): import("@prisma/client").Prisma.Prisma__WifiConfigClient<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        ssid: string;
        bssid: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    track(dto: TrackLocationDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__LocationTrackingClient<{
        id: string;
        createdAt: Date;
        userId: string;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        accuracyMeters: number | null;
        recordedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
