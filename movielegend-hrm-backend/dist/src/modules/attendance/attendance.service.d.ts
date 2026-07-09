import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { FaceVerificationService } from '../face/services/face-verification.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../uploads/image-processing.service';
import { AttendanceQueryDto, CheckInDto, CheckOutDto, CreateAttendanceAdjustmentDto, CreateAttendanceLocationDto, CreateWifiConfigDto, TrackLocationDto } from './dto/attendance.dto';
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
            shift: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
                startTime: string;
                endTime: string;
                breakMinutes: number;
                checkInEarlyMinutes: number;
                checkInLateMinutes: number;
                checkOutEarlyMinutes: number;
                checkOutLateMinutes: number;
                isNightShift: boolean;
            };
            department: {
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                leaderUserId: string | null;
            };
        } & {
            userId: string;
            departmentId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            type: import("@prisma/client").$Enums.AttendanceVerificationType;
            id: string;
            createdAt: Date;
            metadata: Prisma.JsonValue | null;
            provider: string | null;
            attendanceRecordId: string;
            success: boolean;
            score: Prisma.Decimal | null;
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
        userId: string;
        departmentId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
            shift: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
                startTime: string;
                endTime: string;
                breakMinutes: number;
                checkInEarlyMinutes: number;
                checkInLateMinutes: number;
                checkOutEarlyMinutes: number;
                checkOutLateMinutes: number;
                isNightShift: boolean;
            };
            department: {
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                leaderUserId: string | null;
            };
        } & {
            userId: string;
            departmentId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            type: import("@prisma/client").$Enums.AttendanceVerificationType;
            id: string;
            createdAt: Date;
            metadata: Prisma.JsonValue | null;
            provider: string | null;
            attendanceRecordId: string;
            success: boolean;
            score: Prisma.Decimal | null;
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
        userId: string;
        departmentId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
                shift: {
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    code: string;
                    startTime: string;
                    endTime: string;
                    breakMinutes: number;
                    checkInEarlyMinutes: number;
                    checkInLateMinutes: number;
                    checkOutEarlyMinutes: number;
                    checkOutLateMinutes: number;
                    isNightShift: boolean;
                };
                department: {
                    description: string | null;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    leaderUserId: string | null;
                };
            } & {
                userId: string;
                departmentId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                shift: {
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    code: string;
                    startTime: string;
                    endTime: string;
                    breakMinutes: number;
                    checkInEarlyMinutes: number;
                    checkInLateMinutes: number;
                    checkOutEarlyMinutes: number;
                    checkOutLateMinutes: number;
                    isNightShift: boolean;
                };
                department: {
                    description: string | null;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    companyId: string;
                    branchId: string | null;
                    parentId: string | null;
                    code: string;
                    leaderUserId: string | null;
                };
            } & {
                userId: string;
                departmentId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                departmentId: string | null;
                id: string;
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
            shift: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
                startTime: string;
                endTime: string;
                breakMinutes: number;
                checkInEarlyMinutes: number;
                checkInLateMinutes: number;
                checkOutEarlyMinutes: number;
                checkOutLateMinutes: number;
                isNightShift: boolean;
            };
            department: {
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                companyId: string;
                branchId: string | null;
                parentId: string | null;
                code: string;
                leaderUserId: string | null;
            };
        } & {
            userId: string;
            departmentId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
        departmentId: string | null;
        id: string;
        name: string;
        radiusMeters: number;
    }[]>;
    createAdjustment(dto: CreateAttendanceAdjustmentDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        departmentId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AttendanceAdjustmentStatus;
        reason: string;
        decidedByUserId: string | null;
        decidedAt: Date | null;
        attendanceRecordId: string | null;
        requestedCheckInAt: Date | null;
        requestedCheckOutAt: Date | null;
    }>;
    approveAdjustment(id: string, actor: AuthenticatedUser): Promise<{
        userId: string;
        departmentId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
            phone: string;
            email: string | null;
            id: string;
            userCode: string;
            profile: {
                userId: string;
                fullName: string;
                positionId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                deletedAt: Date | null;
                code: string;
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
            userId: string;
            departmentId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ShiftAssignmentStatus;
            workDate: Date;
            shiftId: string;
            assignedByUserId: string | null;
        };
    } & {
        userId: string;
        departmentId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    })[]>;
    createLocation(dto: CreateAttendanceLocationDto): Prisma.Prisma__AttendanceLocationClient<{
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        latitude: Prisma.Decimal;
        longitude: Prisma.Decimal;
        radiusMeters: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    createWifi(dto: CreateWifiConfigDto): Prisma.Prisma__WifiConfigClient<{
        departmentId: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        ssid: string;
        bssid: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    trackLocation(dto: TrackLocationDto, userId: string): Prisma.Prisma__LocationTrackingClient<{
        userId: string;
        id: string;
        createdAt: Date;
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
