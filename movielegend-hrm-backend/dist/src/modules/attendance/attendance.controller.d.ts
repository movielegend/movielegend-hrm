import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto, CheckInDto, CheckOutDto, CreateAttendanceAdjustmentDto, CreateAttendanceLocationDto, CreateWifiConfigDto, TrackLocationDto, UpdateAttendanceLocationDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(dto: CheckInDto, actor: AuthenticatedUser): Promise<{
        shiftAssignment: {
            department: {
                id: string;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                name: string;
                description: string | null;
                leaderUserId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
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
            userId: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            workDate: Date;
            shiftId: string;
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
        userId: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        workDate: Date;
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
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                name: string;
                description: string | null;
                leaderUserId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
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
            userId: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            workDate: Date;
            shiftId: string;
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
        userId: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        workDate: Date;
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
        userId: string;
        departmentId: string;
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
        userId: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        attendanceRecordId: string | null;
        requestedCheckInAt: Date | null;
        requestedCheckOutAt: Date | null;
    }>;
    findAll(actor: AuthenticatedUser, query: AttendanceQueryDto): Promise<{
        items: ({
            user: {
                id: string;
                userCode: string;
                phone: string;
                email: string | null;
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
                userId: string;
                departmentId: string;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                workDate: Date;
                shiftId: string;
                assignedByUserId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            workDate: Date;
            photoFileId: string | null;
            shiftAssignmentId: string;
            checkInAt: Date;
            checkOutAt: Date | null;
            checkInLatitude: import("@prisma/client/runtime/library").Decimal | null;
            checkInLongitude: import("@prisma/client/runtime/library").Decimal | null;
            checkOutLatitude: import("@prisma/client/runtime/library").Decimal | null;
            checkOutLongitude: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDashboardStats(actor: AuthenticatedUser, query: AttendanceQueryDto): Promise<{
        totalUsers: number;
        present: number;
        onTime: number;
        late: number;
        absent: number;
    }>;
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
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    name: string;
                    description: string | null;
                    leaderUserId: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
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
                userId: string;
                departmentId: string;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                workDate: Date;
                shiftId: string;
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
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    name: string;
                    description: string | null;
                    leaderUserId: string | null;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
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
                userId: string;
                departmentId: string;
                status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
                workDate: Date;
                shiftId: string;
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
        departmentIds: string[];
        id: string;
        branchId: string | null;
        name: string;
        departments: {
            id: string;
        }[];
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
                branchId: string | null;
                name: string;
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
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                name: string;
                description: string | null;
                leaderUserId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
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
            userId: string;
            departmentId: string;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            workDate: Date;
            shiftId: string;
            assignedByUserId: string | null;
        };
        photo: {
            fileId: string;
            fileUrl: string;
        } | null;
    }>;
    createLocation(dto: CreateAttendanceLocationDto): import("@prisma/client").Prisma.Prisma__AttendanceLocationClient<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateLocation(id: string, dto: UpdateAttendanceLocationDto): import("@prisma/client").Prisma.Prisma__AttendanceLocationClient<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    removeLocation(id: string): Promise<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: import("@prisma/client/runtime/library").Decimal;
        longitude: import("@prisma/client/runtime/library").Decimal;
        radiusMeters: number;
    }>;
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
