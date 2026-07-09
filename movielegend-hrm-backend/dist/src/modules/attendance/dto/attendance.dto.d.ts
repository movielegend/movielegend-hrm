import { AttendanceStatus } from '@prisma/client';
export declare class AttendanceQueryDto {
    fromDate?: string;
    toDate?: string;
    status?: AttendanceStatus;
    departmentId?: string;
    page: number;
    limit: number;
}
export declare class CheckInDto {
    workDate: string;
    latitude: number;
    longitude: number;
    wifiSsid?: string;
    wifiBssid?: string;
    faceImage?: string;
    photoFileId?: string;
    accuracy?: number;
}
export declare class CheckOutDto {
    latitude: number;
    longitude: number;
}
export declare class CreateAttendanceAdjustmentDto {
    attendanceRecordId?: string;
    requestedCheckInAt?: string;
    requestedCheckOutAt?: string;
    reason: string;
}
export declare class CreateAttendanceLocationDto {
    branchId?: string;
    departmentIds?: string[];
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
}
declare const UpdateAttendanceLocationDto_base: import("@nestjs/common").Type<Partial<CreateAttendanceLocationDto>>;
export declare class UpdateAttendanceLocationDto extends UpdateAttendanceLocationDto_base {
    isActive?: boolean;
}
export declare class CreateWifiConfigDto {
    departmentId?: string;
    ssid: string;
    bssid?: string;
}
export declare class TrackLocationDto {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
}
export {};
