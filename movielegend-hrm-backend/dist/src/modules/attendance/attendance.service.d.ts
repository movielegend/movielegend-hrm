import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { FaceVerificationService } from '../face/services/face-verification.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../uploads/image-processing.service';
import { AttendanceQueryDto, CheckInDto, CheckOutDto, CreateAttendanceAdjustmentDto, CreateAttendanceLocationDto, CreateWifiConfigDto, TrackLocationDto, UpdateAttendanceLocationDto } from './dto/attendance.dto';
export declare class AttendanceService {
    private readonly prisma;
    private readonly scope;
    private readonly faceVerification;
    private readonly imageProcessing;
    private readonly storage;
    private readonly businessTime;
    constructor(prisma: PrismaService, scope: DepartmentScopeService, faceVerification: FaceVerificationService, imageProcessing: ImageProcessingService, storage: StorageService, businessTime?: BusinessTimeService);
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
            metadata: Prisma.JsonValue | null;
            attendanceRecordId: string;
            success: boolean;
            score: Prisma.Decimal | null;
            provider: string | null;
        }[];
        adjustments: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
            decidedAt: Date | null;
            reason: string;
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
        checkInLatitude: Prisma.Decimal | null;
        checkInLongitude: Prisma.Decimal | null;
        checkOutLatitude: Prisma.Decimal | null;
        checkOutLongitude: Prisma.Decimal | null;
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
            metadata: Prisma.JsonValue | null;
            attendanceRecordId: string;
            success: boolean;
            score: Prisma.Decimal | null;
            provider: string | null;
        }[];
        adjustments: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
            decidedAt: Date | null;
            reason: string;
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
        checkInLatitude: Prisma.Decimal | null;
        checkInLongitude: Prisma.Decimal | null;
        checkOutLatitude: Prisma.Decimal | null;
        checkOutLongitude: Prisma.Decimal | null;
    }) | null>;
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
    detail(id: string, actor: AuthenticatedUser): Promise<{
        scheduledStartAt: Date;
        scheduledEndAt: Date;
        workedMinutes: number;
        lateMinutes: number;
        earlyLeaveMinutes: number;
        overtimeMinutes: number;
        gps: {
            checkInLatitude: Prisma.Decimal | null;
            checkInLongitude: Prisma.Decimal | null;
            checkOutLatitude: Prisma.Decimal | null;
            checkOutLongitude: Prisma.Decimal | null;
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
    createAdjustment(dto: CreateAttendanceAdjustmentDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        departmentId: string;
        status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        reason: string;
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
        decidedByUserId: string | null;
        decidedAt: Date | null;
        reason: string;
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
            checkInLatitude: Prisma.Decimal | null;
            checkInLongitude: Prisma.Decimal | null;
            checkOutLatitude: Prisma.Decimal | null;
            checkOutLongitude: Prisma.Decimal | null;
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
    createLocation(dto: CreateAttendanceLocationDto): Prisma.Prisma__AttendanceLocationClient<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateLocation(id: string, dto: UpdateAttendanceLocationDto): Prisma.Prisma__AttendanceLocationClient<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    removeLocation(id: string): Promise<{
        id: string;
        branchId: string | null;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        radiusMeters: number;
    }>;
    createWifi(dto: CreateWifiConfigDto): Prisma.Prisma__WifiConfigClient<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
        ssid: string;
        bssid: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    trackLocation(dto: TrackLocationDto, userId: string): Prisma.Prisma__LocationTrackingClient<{
        id: string;
        createdAt: Date;
        userId: string;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        accuracyMeters: number | null;
        recordedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    private attendanceInclude;
    private validateAttendancePhoto;
    private findAllowedLocation;
    private assertWifiAllowed;
    private isWithinCheckInWindow;
    private shiftDateTime;
    private shiftEndDateTime;
    private distanceMeters;
    private departmentFilter;
    private relevantDepartmentIds;
    private assertAttendanceAccess;
    private stateFor;
    private toAttendanceSummary;
    private locationFromRecord;
    private toAttendanceDetail;
    private minutesBetween;
    private paginate;
}
