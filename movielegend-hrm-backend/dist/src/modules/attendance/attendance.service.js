"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const face_verification_service_1 = require("../face/services/face-verification.service");
const department_scope_service_1 = require("../phase2-policy/department-scope.service");
const business_time_service_1 = require("../time/business-time.service");
let AttendanceService = class AttendanceService {
    prisma;
    scope;
    faceVerification;
    businessTime;
    constructor(prisma, scope, faceVerification, businessTime = new business_time_service_1.BusinessTimeService()) {
        this.prisma = prisma;
        this.scope = scope;
        this.faceVerification = faceVerification;
        this.businessTime = businessTime;
    }
    async checkIn(dto, actor) {
        const workDate = this.businessTime.startOfBusinessDate(dto.workDate);
        const assignment = await this.prisma.shiftAssignment.findUnique({
            where: { userId_workDate: { userId: actor.userId, workDate } },
            include: { shift: true },
        });
        if (!assignment)
            throw (0, error_util_1.notFound)('SHIFT_ASSIGNMENT_NOT_FOUND', 'Khong tim thay ca lam trong ngay');
        if (!assignment.shift.isActive || assignment.shift.deletedAt) {
            throw (0, error_util_1.badRequest)('SHIFT_INACTIVE', 'Ca lam da bi vo hieu hoa');
        }
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: { userId_workDate: { userId: actor.userId, workDate } },
        });
        if (existing)
            throw (0, error_util_1.conflict)('ALREADY_CHECKED_IN', 'Bang cong da co check-in cho ngay nay');
        const photo = dto.photoFileId ? await this.validateAttendancePhoto(dto.photoFileId, actor.userId) : null;
        const faceImage = photo?.fileUrl ?? dto.faceImage;
        if (!faceImage)
            throw (0, error_util_1.badRequest)('ATTENDANCE_PHOTO_REQUIRED', 'Can anh cham cong');
        const location = await this.findAllowedLocation(assignment.departmentId, dto.latitude, dto.longitude);
        if (!location)
            throw (0, error_util_1.badRequest)('OUTSIDE_ATTENDANCE_RADIUS', 'Check-in ngoai pham vi GPS cho phep');
        await this.assertWifiAllowed(assignment.departmentId, dto.wifiSsid, dto.wifiBssid);
        const now = new Date();
        const windowOk = this.isWithinCheckInWindow(workDate, assignment.shift.startTime, assignment.shift.checkInEarlyMinutes, assignment.shift.checkInLateMinutes);
        if (!windowOk)
            throw (0, error_util_1.badRequest)('TOO_EARLY_TO_CHECK_IN', 'Check-in ngoai khung gio cho phep cua ca');
        const face = await this.faceVerification.verifyAttendanceFace({
            userId: actor.userId,
            image: faceImage,
        });
        if (!face.matched) {
            throw (0, error_util_1.badRequest)('FACE_VERIFICATION_FAILED', face.reason ?? 'Xac minh khuon mat khong thanh cong');
        }
        return this.prisma.$transaction(async (tx) => {
            if (photo) {
                const attached = await tx.uploadedFile.updateMany({
                    where: {
                        id: photo.id,
                        status: client_1.UploadedFileStatus.TEMPORARY,
                        uploadedById: actor.userId,
                        deletedAt: null,
                    },
                    data: { status: client_1.UploadedFileStatus.ATTACHED },
                });
                if (attached.count !== 1) {
                    throw (0, error_util_1.badRequest)('ATTENDANCE_PHOTO_INVALID', 'Anh cham cong khong con kha dung');
                }
            }
            const record = await tx.attendanceRecord.create({
                data: {
                    userId: actor.userId,
                    departmentId: assignment.departmentId,
                    shiftAssignmentId: assignment.id,
                    photoFileId: photo?.id,
                    workDate,
                    checkInAt: now,
                    checkInLatitude: dto.latitude,
                    checkInLongitude: dto.longitude,
                    verifications: {
                        create: [
                            {
                                type: client_1.AttendanceVerificationType.GPS,
                                success: true,
                                metadata: {
                                    attendanceLocationId: location.id,
                                    accuracy: dto.accuracy,
                                },
                            },
                            {
                                type: client_1.AttendanceVerificationType.FACE,
                                success: face.matched,
                                score: face.confidence,
                                provider: face.provider,
                                metadata: {
                                    reason: face.reason,
                                    photoFileId: photo?.id,
                                    legacyFaceImage: photo ? undefined : Boolean(dto.faceImage),
                                },
                            },
                        ],
                    },
                },
                include: this.attendanceInclude(),
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'attendance.checkin',
                    entityType: 'AttendanceRecord',
                    entityId: record.id,
                    metadata: { workDate: dto.workDate, departmentId: assignment.departmentId, photoFileId: photo?.id },
                },
            });
            return record;
        });
    }
    async checkOut(dto, actor) {
        const record = await this.prisma.attendanceRecord.findFirst({
            where: { userId: actor.userId },
            include: { shiftAssignment: { include: { shift: true } } },
            orderBy: { checkInAt: 'desc' },
        });
        if (!record)
            throw (0, error_util_1.badRequest)('NOT_CHECKED_IN', 'Chua co ban ghi check-in dang mo');
        if (record.checkOutAt)
            throw (0, error_util_1.conflict)('ALREADY_CHECKED_OUT', 'Bang cong da checkout');
        const now = new Date();
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.attendanceRecord.updateMany({
                where: { id: record.id, checkOutAt: null },
                data: {
                    checkOutAt: now,
                    checkOutLatitude: dto.latitude,
                    checkOutLongitude: dto.longitude,
                    status: client_1.AttendanceStatus.CHECKED_OUT,
                },
            });
            if (updated.count === 0)
                throw (0, error_util_1.conflict)('ALREADY_CHECKED_OUT', 'Bang cong da checkout');
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'attendance.checkout',
                    entityType: 'AttendanceRecord',
                    entityId: record.id,
                    metadata: {
                        checkInAt: record.checkInAt,
                        checkOutAt: now,
                        workedMinutes: this.minutesBetween(record.checkInAt, now),
                    },
                },
            });
            return tx.attendanceRecord.findUnique({
                where: { id: record.id },
                include: this.attendanceInclude(),
            });
        });
    }
    async current(actor) {
        const today = this.businessTime.startOfBusinessDate(this.businessTime.businessDateString());
        const yesterday = this.businessTime.addDays(today, -1);
        const record = await this.prisma.attendanceRecord.findFirst({
            where: {
                userId: actor.userId,
                workDate: { gte: yesterday, lte: today },
            },
            include: this.attendanceInclude(),
            orderBy: [{ workDate: 'desc' }, { checkInAt: 'desc' }],
        });
        if (!record)
            return { state: 'NONE', attendance: null };
        return {
            state: this.stateFor(record),
            attendance: this.toAttendanceSummary(record),
        };
    }
    async myHistory(actor, query) {
        const where = {
            userId: actor.userId,
            ...(query.status ? { status: query.status } : {}),
            ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
                ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.attendanceRecord.findMany({
                where,
                include: this.attendanceInclude(),
                orderBy: [{ workDate: 'desc' }, { checkInAt: 'desc' }],
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prisma.attendanceRecord.count({ where }),
        ]);
        return this.paginate(items.map((item) => this.toAttendanceSummary(item)), total, query.page, query.limit);
    }
    async detail(id, actor) {
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id },
            include: this.attendanceInclude(),
        });
        if (!record)
            throw (0, error_util_1.notFound)('ATTENDANCE_NOT_FOUND', 'Khong tim thay bang cong');
        this.assertAttendanceAccess(actor, record.userId, record.departmentId);
        const location = await this.locationFromRecord(record);
        return this.toAttendanceDetail(record, location);
    }
    async activeLocations(actor) {
        const visibleDepartmentIds = await this.relevantDepartmentIds(actor);
        const locations = await this.prisma.attendanceLocation.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                ...(visibleDepartmentIds === null
                    ? {}
                    : { OR: [{ departmentId: null }, { departmentId: { in: visibleDepartmentIds } }] }),
            },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                radiusMeters: true,
                departmentId: true,
            },
            orderBy: { name: 'asc' },
        });
        return locations.map((location) => ({
            ...location,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
        }));
    }
    async createAdjustment(dto, actor) {
        const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
        if (dto.attendanceRecordId) {
            const record = await this.prisma.attendanceRecord.findUnique({
                where: { id: dto.attendanceRecordId },
            });
            if (!record)
                throw (0, error_util_1.notFound)('ATTENDANCE_NOT_FOUND', 'Khong tim thay bang cong');
            if (record.userId !== actor.userId) {
                throw (0, error_util_1.badRequest)('ATTENDANCE_ADJUSTMENT_OWNER_ONLY', 'Chi duoc tao yeu cau sua cong cua chinh minh');
            }
        }
        return this.prisma.attendanceAdjustment.create({
            data: {
                userId: actor.userId,
                departmentId,
                attendanceRecordId: dto.attendanceRecordId,
                requestedCheckInAt: dto.requestedCheckInAt ? new Date(dto.requestedCheckInAt) : undefined,
                requestedCheckOutAt: dto.requestedCheckOutAt ? new Date(dto.requestedCheckOutAt) : undefined,
                reason: dto.reason,
            },
        });
    }
    approveAdjustment(id, actor) {
        return this.prisma.$transaction(async (tx) => {
            const adjustment = await tx.attendanceAdjustment.findUnique({
                where: { id },
                include: { attendanceRecord: true },
            });
            if (!adjustment)
                throw (0, error_util_1.notFound)('ATTENDANCE_ADJUSTMENT_NOT_FOUND', 'Khong tim thay yeu cau sua cong');
            this.scope.assertDepartmentAccess(actor, adjustment.departmentId);
            if (adjustment.status !== client_1.AttendanceAdjustmentStatus.PENDING) {
                throw (0, error_util_1.badRequest)('ATTENDANCE_ADJUSTMENT_ALREADY_PROCESSED', 'Yeu cau sua cong da duoc xu ly');
            }
            const oldValue = adjustment.attendanceRecord
                ? {
                    checkInAt: adjustment.attendanceRecord.checkInAt,
                    checkOutAt: adjustment.attendanceRecord.checkOutAt,
                }
                : null;
            if (adjustment.attendanceRecordId) {
                await tx.attendanceRecord.update({
                    where: { id: adjustment.attendanceRecordId },
                    data: {
                        checkInAt: adjustment.requestedCheckInAt ?? undefined,
                        checkOutAt: adjustment.requestedCheckOutAt ?? undefined,
                        status: client_1.AttendanceStatus.ADJUSTED,
                    },
                });
            }
            const approved = await tx.attendanceAdjustment.update({
                where: { id },
                data: {
                    status: client_1.AttendanceAdjustmentStatus.APPROVED,
                    decidedByUserId: actor.userId,
                    decidedAt: new Date(),
                },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'attendance.adjustment.approve',
                    entityType: 'AttendanceAdjustment',
                    entityId: id,
                    metadata: {
                        oldValue,
                        newValue: {
                            checkInAt: adjustment.requestedCheckInAt,
                            checkOutAt: adjustment.requestedCheckOutAt,
                        },
                    },
                },
            });
            return approved;
        });
    }
    async findAll(actor, departmentId) {
        const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
        const departmentFilter = this.departmentFilter(departmentId, visibleDepartmentIds);
        return this.prisma.attendanceRecord.findMany({
            where: departmentFilter ? { departmentId: departmentFilter } : {},
            include: {
                user: {
                    select: {
                        id: true,
                        userCode: true,
                        phone: true,
                        email: true,
                        profile: true,
                    },
                },
                shiftAssignment: { include: { shift: true } },
            },
            orderBy: { checkInAt: 'desc' },
        });
    }
    createLocation(dto) {
        return this.prisma.attendanceLocation.create({ data: dto });
    }
    createWifi(dto) {
        return this.prisma.wifiConfig.create({ data: dto });
    }
    trackLocation(dto, userId) {
        return this.prisma.locationTracking.create({
            data: {
                userId,
                latitude: dto.latitude,
                longitude: dto.longitude,
                accuracyMeters: dto.accuracyMeters,
            },
        });
    }
    attendanceInclude() {
        return {
            verifications: true,
            photoFile: {
                select: { id: true, fileUrl: true, mimeType: true, size: true },
            },
            adjustments: {
                select: {
                    id: true,
                    status: true,
                    requestedCheckInAt: true,
                    requestedCheckOutAt: true,
                    reason: true,
                    decidedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            shiftAssignment: { include: { shift: true, department: true } },
        };
    }
    async validateAttendancePhoto(photoFileId, userId) {
        const file = await this.prisma.uploadedFile.findUnique({ where: { id: photoFileId } });
        if (!file || file.deletedAt)
            throw (0, error_util_1.notFound)('ATTENDANCE_PHOTO_INVALID', 'Anh cham cong khong hop le');
        if (file.uploadedById !== userId) {
            throw (0, error_util_1.forbidden)('ATTENDANCE_PHOTO_FORBIDDEN', 'Khong duoc dung file cua user khac');
        }
        if (file.purpose !== client_1.UploadPurpose.ATTENDANCE) {
            throw (0, error_util_1.badRequest)('ATTENDANCE_PHOTO_INVALID', 'File khong dung muc dich ATTENDANCE');
        }
        if (file.status !== client_1.UploadedFileStatus.TEMPORARY) {
            throw (0, error_util_1.badRequest)('ATTENDANCE_PHOTO_INVALID', 'File cham cong khong con o trang thai tam');
        }
        return file;
    }
    async findAllowedLocation(departmentId, latitude, longitude) {
        const locations = await this.prisma.attendanceLocation.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                OR: [{ departmentId }, { departmentId: null }],
            },
        });
        return locations.find((location) => {
            const distance = this.distanceMeters(latitude, longitude, Number(location.latitude), Number(location.longitude));
            return distance <= location.radiusMeters;
        });
    }
    async assertWifiAllowed(departmentId, ssid, bssid) {
        const configs = await this.prisma.wifiConfig.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                OR: [{ departmentId }, { departmentId: null }],
            },
        });
        if (!configs.length)
            return;
        if (!ssid)
            throw (0, error_util_1.badRequest)('INVALID_WIFI', 'Thieu thong tin WiFi');
        const matched = configs.some((config) => {
            if (config.ssid !== ssid)
                return false;
            return config.bssid ? config.bssid === bssid : true;
        });
        if (!matched)
            throw (0, error_util_1.badRequest)('INVALID_WIFI', 'WiFi khong hop le');
    }
    isWithinCheckInWindow(workDate, startTime, earlyMinutes, lateMinutes) {
        const shiftStart = this.shiftDateTime(workDate, startTime);
        const now = new Date();
        return now >= new Date(shiftStart.getTime() - earlyMinutes * 60_000) &&
            now <= new Date(shiftStart.getTime() + lateMinutes * 60_000);
    }
    shiftDateTime(workDate, time) {
        const [hour = 0, minute = 0] = time.split(':').map(Number);
        const date = new Date(workDate);
        date.setUTCHours(hour, minute, 0, 0);
        return date;
    }
    shiftEndDateTime(workDate, startTime, endTime) {
        const start = this.shiftDateTime(workDate, startTime);
        const end = this.shiftDateTime(workDate, endTime);
        return end <= start ? this.businessTime.addDays(end, 1) : end;
    }
    distanceMeters(lat1, lon1, lat2, lon2) {
        const toRad = (value) => (value * Math.PI) / 180;
        const earthRadius = 6_371_000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    departmentFilter(requestedDepartmentId, visibleDepartmentIds) {
        if (visibleDepartmentIds === null)
            return requestedDepartmentId;
        if (requestedDepartmentId) {
            return visibleDepartmentIds.includes(requestedDepartmentId)
                ? requestedDepartmentId
                : { in: ['00000000-0000-0000-0000-000000000000'] };
        }
        return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
    }
    async relevantDepartmentIds(actor) {
        const visible = this.scope.visibleDepartmentIds(actor);
        if (visible === null)
            return null;
        if (visible.length)
            return visible;
        return [await this.scope.getPrimaryDepartmentId(actor.userId)];
    }
    assertAttendanceAccess(actor, userId, departmentId) {
        if (userId === actor.userId)
            return;
        if (actor.permissions.includes('attendance.read') && this.scope.canAccessDepartment(actor, departmentId))
            return;
        throw (0, error_util_1.forbidden)('ATTENDANCE_FORBIDDEN', 'Khong co quyen xem bang cong nay');
    }
    stateFor(record) {
        if (record.checkOutAt || record.status === client_1.AttendanceStatus.CHECKED_OUT)
            return 'CHECKED_OUT';
        return 'CHECKED_IN';
    }
    toAttendanceSummary(record) {
        return {
            id: record.id,
            userId: record.userId,
            departmentId: record.departmentId,
            shiftAssignmentId: record.shiftAssignmentId,
            workDate: record.workDate,
            checkInAt: record.checkInAt,
            checkOutAt: record.checkOutAt,
            status: record.status,
            shiftAssignment: record.shiftAssignment,
            photo: record.photoFile ? { fileId: record.photoFile.id, fileUrl: record.photoFile.fileUrl } : null,
        };
    }
    async locationFromRecord(record) {
        const gps = record.verifications.find((verification) => verification.type === client_1.AttendanceVerificationType.GPS);
        const metadata = gps?.metadata && typeof gps.metadata === 'object' && !Array.isArray(gps.metadata)
            ? gps.metadata
            : null;
        if (!metadata?.attendanceLocationId)
            return null;
        const location = await this.prisma.attendanceLocation.findUnique({
            where: { id: metadata.attendanceLocationId },
            select: { id: true, name: true, latitude: true, longitude: true, radiusMeters: true, departmentId: true },
        });
        return location
            ? {
                ...location,
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
            }
            : null;
    }
    toAttendanceDetail(record, attendanceLocation) {
        const shift = record.shiftAssignment.shift;
        const scheduledStart = this.shiftDateTime(record.workDate, shift.startTime);
        const scheduledEnd = this.shiftEndDateTime(record.workDate, shift.startTime, shift.endTime);
        const workedMinutes = record.checkOutAt ? this.minutesBetween(record.checkInAt, record.checkOutAt) : 0;
        return {
            ...this.toAttendanceSummary(record),
            scheduledStartAt: scheduledStart,
            scheduledEndAt: scheduledEnd,
            workedMinutes,
            lateMinutes: Math.max(0, this.minutesBetween(scheduledStart, record.checkInAt)),
            earlyLeaveMinutes: record.checkOutAt ? Math.max(0, this.minutesBetween(record.checkOutAt, scheduledEnd)) : 0,
            overtimeMinutes: record.checkOutAt ? Math.max(0, this.minutesBetween(scheduledEnd, record.checkOutAt)) : 0,
            gps: {
                checkInLatitude: record.checkInLatitude,
                checkInLongitude: record.checkInLongitude,
                checkOutLatitude: record.checkOutLatitude,
                checkOutLongitude: record.checkOutLongitude,
                attendanceLocation,
            },
            adjustmentSummary: record.adjustments.map((adjustment) => ({
                id: adjustment.id,
                status: adjustment.status,
                requestedCheckInAt: adjustment.requestedCheckInAt,
                requestedCheckOutAt: adjustment.requestedCheckOutAt,
                reason: adjustment.reason,
                decidedAt: adjustment.decidedAt,
            })),
        };
    }
    minutesBetween(start, end) {
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000));
    }
    paginate(items, total, page, limit) {
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        department_scope_service_1.DepartmentScopeService,
        face_verification_service_1.FaceVerificationService,
        business_time_service_1.BusinessTimeService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map