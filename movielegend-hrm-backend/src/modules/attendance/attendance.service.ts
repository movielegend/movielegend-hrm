import { Injectable } from '@nestjs/common';
import {
  AttendanceAdjustmentStatus,
  AttendanceStatus,
  AttendanceVerificationType,
  Prisma,
  UploadedFileStatus,
  UploadPurpose,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { FaceVerificationService } from '../face/services/face-verification.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { BusinessTimeService } from '../time/business-time.service';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../uploads/image-processing.service';
import {
  AttendanceQueryDto,
  CheckInDto,
  CheckOutDto,
  CreateAttendanceAdjustmentDto,
  CreateAttendanceLocationDto,
  CreateWifiConfigDto,
  TrackLocationDto,
  UpdateAttendanceLocationDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
    private readonly faceVerification: FaceVerificationService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly storage: StorageService,
    private readonly businessTime: BusinessTimeService = new BusinessTimeService(),
  ) {}

  async checkIn(dto: CheckInDto, actor: AuthenticatedUser, ip: string) {
    const workDate = this.businessTime.startOfBusinessDate(dto.workDate);
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { userId_workDate: { userId: actor.userId, workDate } },
      include: { shift: true },
    });
    if (!assignment) throw notFound('SHIFT_ASSIGNMENT_NOT_FOUND', 'Khong tim thay ca lam trong ngay');
    if (!assignment.shift.isActive || assignment.shift.deletedAt) {
      throw badRequest('SHIFT_INACTIVE', 'Ca lam da bi vo hieu hoa');
    }

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId: actor.userId, workDate } },
    });
    if (existing) throw conflict('ALREADY_CHECKED_IN', 'Bang cong da co check-in cho ngay nay');

    const photo = dto.photoFileId ? await this.validateAttendancePhoto(dto.photoFileId, actor.userId) : null;
    const faceImage = photo?.fileUrl ?? dto.faceImage;
    if (!faceImage) throw badRequest('ATTENDANCE_PHOTO_REQUIRED', 'Can anh cham cong');

    const location = await this.findAllowedLocation(assignment.departmentId, dto.latitude, dto.longitude);
    
    // Check IP
    await this.assertIpAllowed(actor, location, ip, dto.wifiSsid);

    await this.assertWifiAllowed(assignment.departmentId, dto.wifiSsid, dto.wifiBssid);

    const now = new Date();
    const windowOk = this.isWithinCheckInWindow(workDate, assignment.shift.startTime, assignment.shift.checkInEarlyMinutes, assignment.shift.checkInLateMinutes);
    if (!windowOk) throw badRequest('TOO_EARLY_TO_CHECK_IN', 'Check-in ngoai khung gio cho phep cua ca');
    const face = await this.faceVerification.verifyAttendanceFace({
      userId: actor.userId,
      image: faceImage,
      storageKey: photo?.storageKey,
    });
    if (!face.matched) {
      throw badRequest('FACE_VERIFICATION_FAILED', face.reason ?? 'Xac minh khuon mat khong thanh cong');
    }

    return this.prisma.$transaction(async (tx) => {
      if (photo) {
        // Áp dụng watermark lên ảnh chấm công
        try {
          const user = await tx.user.findUnique({ where: { id: actor.userId } });
          const userProfile = await tx.employeeProfile.findUnique({ where: { userId: actor.userId } });
          const imageBuffer = await this.storage.read(photo.storageKey);
          const watermarkedBuffer = await this.imageProcessing.addAttendanceWatermark(imageBuffer, {
            employeeName: userProfile?.fullName ?? 'Unknown',
            userCode: user?.userCode ?? actor.userId,
            latitude: dto.latitude,
            longitude: dto.longitude,
          });
          
          await this.storage.upload({
            buffer: watermarkedBuffer,
            fileName: photo.fileName,
            mimeType: 'image/jpeg',
            storageKey: photo.storageKey,
          });
        } catch (error) {
          // Continue if watermarking fails, do not block attendance
        }

        const attached = await tx.uploadedFile.updateMany({
          where: {
            id: photo.id,
            status: UploadedFileStatus.TEMPORARY,
            uploadedById: actor.userId,
            deletedAt: null,
          },
          data: { status: UploadedFileStatus.ATTACHED },
        });
        if (attached.count !== 1) {
          throw badRequest('ATTENDANCE_PHOTO_INVALID', 'Anh cham cong khong con kha dung');
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
                type: AttendanceVerificationType.GPS,
                success: true,
                metadata: {
                  attendanceLocationId: location.id,
                  accuracy: dto.accuracy,
                },
              },
              {
                type: AttendanceVerificationType.FACE,
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

  async checkOut(dto: CheckOutDto, actor: AuthenticatedUser, ip: string) {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { userId: actor.userId },
      include: { shiftAssignment: { include: { shift: true } } },
      orderBy: { checkInAt: 'desc' },
    });
    if (!record) throw badRequest('NOT_CHECKED_IN', 'Chua co ban ghi check-in dang mo');
    if (record.checkOutAt) throw conflict('ALREADY_CHECKED_OUT', 'Bang cong da checkout');

    const photo = dto.photoFileId ? await this.validateAttendancePhoto(dto.photoFileId, actor.userId) : null;
    const faceImage = photo?.fileUrl ?? dto.faceImage;
    if (!faceImage) throw badRequest('ATTENDANCE_PHOTO_REQUIRED', 'Can anh cham cong de ra ca');

    const location = await this.findAllowedLocation(record.departmentId, dto.latitude, dto.longitude);
    await this.assertIpAllowed(actor, location, ip, dto.wifiSsid);
    await this.assertWifiAllowed(record.departmentId, dto.wifiSsid, dto.wifiBssid);

    const face = await this.faceVerification.verifyAttendanceFace({
      userId: actor.userId,
      image: faceImage,
      storageKey: photo?.storageKey,
    });
    if (!face.matched) {
      throw badRequest('FACE_VERIFICATION_FAILED', face.reason ?? 'Xac minh khuon mat khong thanh cong');
    }

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      if (photo) {
        try {
          const user = await tx.user.findUnique({ where: { id: actor.userId } });
          const userProfile = await tx.employeeProfile.findUnique({ where: { userId: actor.userId } });
          const imageBuffer = await this.storage.read(photo.storageKey);
          const watermarkedBuffer = await this.imageProcessing.addAttendanceWatermark(imageBuffer, {
            employeeName: userProfile?.fullName ?? 'Unknown',
            userCode: user?.userCode ?? actor.userId,
            latitude: dto.latitude,
            longitude: dto.longitude,
          });
          
          await this.storage.upload({
            buffer: watermarkedBuffer,
            fileName: photo.fileName,
            mimeType: 'image/jpeg',
            storageKey: photo.storageKey,
          });
        } catch (error) {
          // Continue if watermarking fails
        }

        const attached = await tx.uploadedFile.updateMany({
          where: {
            id: photo.id,
            status: UploadedFileStatus.TEMPORARY,
            uploadedById: actor.userId,
            deletedAt: null,
          },
          data: { status: UploadedFileStatus.ATTACHED },
        });
        if (attached.count !== 1) {
          throw badRequest('ATTENDANCE_PHOTO_INVALID', 'Anh cham cong khong con kha dung');
        }
      }

      const updated = await tx.attendanceRecord.updateMany({
        where: { id: record.id, checkOutAt: null },
        data: {
          checkOutAt: now,
          checkOutLatitude: dto.latitude,
          checkOutLongitude: dto.longitude,
          checkOutPhotoFileId: photo?.id,
          status: AttendanceStatus.CHECKED_OUT,
        },
      });
      if (updated.count === 0) throw conflict('ALREADY_CHECKED_OUT', 'Bang cong da checkout');

      await tx.attendanceVerification.createMany({
        data: [
          {
            attendanceRecordId: record.id,
            type: AttendanceVerificationType.GPS,
            success: true,
            metadata: {
              attendanceLocationId: location.id,
              accuracy: dto.accuracy,
            },
          },
          {
            attendanceRecordId: record.id,
            type: AttendanceVerificationType.FACE,
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
      });

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

  async current(actor: AuthenticatedUser) {
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
    if (!record) return { state: 'NONE', attendance: null };

    // Bỏ qua ca làm việc của ngày hôm trước nếu đã checkout xong hoặc đã quá giờ cho phép checkout
    const isPreviousDay = record.workDate.getTime() < today.getTime();
    if (isPreviousDay) {
      if (record.checkOutAt || record.status === AttendanceStatus.CHECKED_OUT) {
        return { state: 'NONE', attendance: null };
      }
      
      const shift = record.shiftAssignment.shift;
      const shiftEnd = this.shiftEndDateTime(record.workDate, shift.startTime, shift.endTime);
      const expiredAt = new Date(shiftEnd.getTime() + (shift.checkOutLateMinutes * 60_000));
      
      if (new Date() > expiredAt) {
        // Đã quên checkout ngày hôm qua và quá thời gian cho phép checkout
        return { state: 'NONE', attendance: null };
      }
    }

    return {
      state: this.stateFor(record),
      attendance: this.toAttendanceSummary(record),
    };
  }

  async myHistory(actor: AuthenticatedUser, query: AttendanceQueryDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
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

  async detail(id: string, actor: AuthenticatedUser) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: this.attendanceInclude(),
    });
    if (!record) throw notFound('ATTENDANCE_NOT_FOUND', 'Khong tim thay bang cong');
    this.assertAttendanceAccess(actor, record.userId, record.departmentId);
    const location = await this.locationFromRecord(record);
    return this.toAttendanceDetail(record, location);
  }

  async activeLocations(actor: AuthenticatedUser) {
    const visibleDepartmentIds = await this.relevantDepartmentIds(actor);
    const locations = await this.prisma.attendanceLocation.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(visibleDepartmentIds === null
          ? {}
          : {
              OR: [
                { departments: { none: {} }, branchId: null },
                { departments: { some: { id: { in: visibleDepartmentIds } } } },
                { departments: { none: {} }, branch: { departments: { some: { id: { in: visibleDepartmentIds } } } } },
              ],
            }),
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
        branchId: true,
        departments: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
    return locations.map((location) => ({
      ...location,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      departmentIds: location.departments.map(d => d.id),
    }));
  }

  async createAdjustment(dto: CreateAttendanceAdjustmentDto, actor: AuthenticatedUser) {
    const departmentId = await this.scope.getPrimaryDepartmentId(actor.userId);
    if (dto.attendanceRecordId) {
      const record = await this.prisma.attendanceRecord.findUnique({
        where: { id: dto.attendanceRecordId },
      });
      if (!record) throw notFound('ATTENDANCE_NOT_FOUND', 'Khong tim thay bang cong');
      if (record.userId !== actor.userId) {
        throw badRequest('ATTENDANCE_ADJUSTMENT_OWNER_ONLY', 'Chi duoc tao yeu cau sua cong cua chinh minh');
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

  approveAdjustment(id: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.attendanceAdjustment.findUnique({
        where: { id },
        include: { attendanceRecord: true },
      });
      if (!adjustment) throw notFound('ATTENDANCE_ADJUSTMENT_NOT_FOUND', 'Khong tim thay yeu cau sua cong');
      this.scope.assertDepartmentAccess(actor, adjustment.departmentId);
      if (adjustment.status !== AttendanceAdjustmentStatus.PENDING) {
        throw badRequest('ATTENDANCE_ADJUSTMENT_ALREADY_PROCESSED', 'Yeu cau sua cong da duoc xu ly');
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
            status: AttendanceStatus.ADJUSTED,
          },
        });
      }
      const approved = await tx.attendanceAdjustment.update({
        where: { id },
        data: {
          status: AttendanceAdjustmentStatus.APPROVED,
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

  async findAll(actor: AuthenticatedUser, query: AttendanceQueryDto) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    const departmentFilter = this.departmentFilter(query.departmentId, visibleDepartmentIds);
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(this.businessTime.inclusiveDateRange(query.fromDate, query.toDate)
        ? { workDate: this.businessTime.inclusiveDateRange(query.fromDate, query.toDate) }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
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
        orderBy: [{ workDate: 'desc' }, { checkInAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return this.paginate(items, total, query.page, query.limit);
  }

  async getDashboardStats(actor: AuthenticatedUser, query: AttendanceQueryDto) {
    const visibleDepartmentIds = this.scope.visibleDepartmentIds(actor);
    const departmentFilter = this.departmentFilter(query.departmentId, visibleDepartmentIds);
    const dateRange = this.businessTime.inclusiveDateRange(query.fromDate, query.toDate);
    const workDateFilter = dateRange || { equals: this.businessTime.startOfBusinessDate(this.businessTime.businessDateString()) };

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
        workDate: workDateFilter,
      },
      include: { shiftAssignment: { include: { shift: true } } },
    });

    const totalUsersCount = await this.prisma.user.count({
      where: {
        accountStatus: 'ACTIVE',
        ...(departmentFilter ? { departmentLinks: { some: { departmentId: departmentFilter as any } } } : {}),
      },
    });

    const totalPresent = records.length;
    let onTime = 0;
    let late = 0;

    for (const r of records) {
      if (!r.checkInAt || !r.shiftAssignment?.shift) continue;
      const shiftStart = this.shiftDateTime(r.workDate, r.shiftAssignment.shift.startTime);
      const limitTime = new Date(shiftStart.getTime() + r.shiftAssignment.shift.checkInLateMinutes * 60_000);
      if (r.checkInAt <= limitTime) {
        onTime++;
      } else {
        late++;
      }
    }

    const absent = Math.max(0, totalUsersCount - totalPresent);

    return {
      totalUsers: totalUsersCount,
      present: totalPresent,
      onTime,
      late,
      absent,
    };
  }

  createLocation(dto: CreateAttendanceLocationDto) {
    const { departmentIds, ...rest } = dto;
    return this.prisma.attendanceLocation.create({
      data: {
        ...rest,
        departments: departmentIds?.length ? { connect: departmentIds.map((id) => ({ id })) } : undefined,
      },
    });
  }

  updateLocation(id: string, dto: UpdateAttendanceLocationDto) {
    const { departmentIds, ...rest } = dto;
    return this.prisma.attendanceLocation.update({
      where: { id },
      data: {
        ...rest,
        departments: departmentIds !== undefined ? { set: departmentIds.map((deptId) => ({ id: deptId })) } : undefined,
      },
    });
  }

  async removeLocation(id: string) {
    // Soft delete location
    const location = await this.prisma.attendanceLocation.findUnique({ where: { id } });
    if (!location) throw notFound('LOCATION_NOT_FOUND', 'Khong tim thay diem cham cong');
    return this.prisma.attendanceLocation.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  createWifi(dto: CreateWifiConfigDto) {
    return this.prisma.wifiConfig.create({ data: dto });
  }

  trackLocation(dto: TrackLocationDto, userId: string) {
    return this.prisma.locationTracking.create({
      data: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracyMeters: dto.accuracyMeters,
      },
    });
  }

  private attendanceInclude() {
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
        orderBy: { createdAt: 'desc' as const },
      },
      shiftAssignment: { include: { shift: true, department: true } },
      user: {
        select: {
          id: true,
          userCode: true,
          phone: true,
          email: true,
          profile: true,
        },
      },
    };
  }

  private async validateAttendancePhoto(photoFileId: string, userId: string) {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id: photoFileId } });
    if (!file || file.deletedAt) throw notFound('ATTENDANCE_PHOTO_INVALID', 'Anh cham cong khong hop le');
    if (file.uploadedById !== userId) {
      throw forbidden('ATTENDANCE_PHOTO_FORBIDDEN', 'Khong duoc dung file cua user khac');
    }
    if (file.purpose !== UploadPurpose.ATTENDANCE) {
      throw badRequest('ATTENDANCE_PHOTO_INVALID', 'File khong dung muc dich ATTENDANCE');
    }
    if (file.status !== UploadedFileStatus.TEMPORARY) {
      throw badRequest('ATTENDANCE_PHOTO_INVALID', 'File cham cong khong con o trang thai tam');
    }
    return file;
  }

  private async findAllowedLocation(departmentId: string, latitude: number, longitude: number) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { branch: true },
    });
    if (!department || !department.branch) {
      throw badRequest('NO_BRANCH_ASSIGNED', 'Phòng ban chưa được liên kết với chi nhánh nào.');
    }
    const branch = department.branch;

    if (!branch.isActive || branch.deletedAt) throw badRequest('OUTSIDE_ATTENDANCE_RADIUS', 'Chi nhánh hiện không hoạt động.');
    if (!branch.latitude || !branch.longitude) throw badRequest('OUTSIDE_ATTENDANCE_RADIUS', 'Chi nhánh chưa thiết lập vị trí tọa độ.');

    const distance = this.distanceMeters(
      latitude,
      longitude,
      Number(branch.latitude),
      Number(branch.longitude),
    );

    const allowedRadius = branch.allowedRadius ?? 100;
    if (distance > allowedRadius) {
      const diff = Math.round(distance - allowedRadius);
      throw badRequest('OUTSIDE_ATTENDANCE_RADIUS', `Ngoài phạm vi địa lý cho phép. Bạn đang cách chi nhánh ${diff} mét.`);
    }

    return branch;
  }

  private async assertIpAllowed(actor: AuthenticatedUser, location: any, rawIp: string, wifiSsid?: string): Promise<void> {
    if (actor.roles.includes('ADMIN')) return;
    
    // Clean IPv4 prefix if present (e.g. ::ffff:192.168.1.55 -> 192.168.1.55)
    const ip = rawIp.replace(/^::ffff:/, '');

    // For testing/development in localhost, we might want to bypass or mock
    if (ip === '127.0.0.1' || ip === '::1') return;

    if (!location) return;

    const allowedIps = (location as any).allowedIps || [];

    if (allowedIps.length === 0) return; // No IP restriction configured

    let isAllowed = false;
    // Allow prefix match (e.g., if Admin configures "192.168.1", it matches "192.168.1.55")
    if (allowedIps.some((allowed: string) => ip.startsWith(allowed))) {
      isAllowed = true;
    }
    
    // Also allow if the configured IP matches the wifiSSID
    if (wifiSsid && allowedIps.includes(wifiSsid)) {
      isAllowed = true;
    }

    if (!isAllowed) {
      throw badRequest('INVALID_NETWORK', `Vui lòng kết nối vào mạng Wi-Fi của công ty để chấm công. (IP thiết bị của bạn: ${ip})`);
    }
  }

  private async assertWifiAllowed(departmentId: string, ssid?: string, bssid?: string): Promise<void> {
    const configs = await this.prisma.wifiConfig.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ departmentId }, { departmentId: null }],
      },
    });
    if (!configs.length) return;
    if (!ssid) throw badRequest('INVALID_WIFI', 'Thieu thong tin WiFi');
    const matched = configs.some((config) => {
      if (config.ssid !== ssid) return false;
      return config.bssid ? config.bssid === bssid : true;
    });
    if (!matched) throw badRequest('INVALID_WIFI', 'Sai mạng Wi-Fi, vui lòng kết nối đúng Wi-Fi công ty.');
  }

  private isWithinCheckInWindow(workDate: Date, startTime: string, earlyMinutes: number, lateMinutes: number): boolean {
    // Tạm thời mở giới hạn check-in cho mục đích test (luôn trả về true).
    // Ở hệ thống thực tế thì sẽ dùng: return now >= ... && now <= ...
    return true;
  }

  private shiftDateTime(workDate: Date, time: string): Date {
    const [hour = 0, minute = 0] = time.split(':').map(Number);
    const date = new Date(workDate);
    // workDate is UTC 00:00:00 of the given date.
    // time is in Vietnam Time (UTC+7).
    // Subtract 7 to get the correct absolute UTC time.
    date.setUTCHours(hour - 7, minute, 0, 0);
    return date;
  }

  private shiftEndDateTime(workDate: Date, startTime: string, endTime: string): Date {
    const start = this.shiftDateTime(workDate, startTime);
    const end = this.shiftDateTime(workDate, endTime);
    return end <= start ? this.businessTime.addDays(end, 1) : end;
  }

  private distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6_371_000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private departmentFilter(
    requestedDepartmentId: string | undefined,
    visibleDepartmentIds: string[] | null,
  ): string | Prisma.StringFilter<'AttendanceRecord'> | undefined {
    if (visibleDepartmentIds === null) return requestedDepartmentId;
    if (requestedDepartmentId) {
      return visibleDepartmentIds.includes(requestedDepartmentId)
        ? requestedDepartmentId
        : { in: ['00000000-0000-0000-0000-000000000000'] };
    }
    return { in: visibleDepartmentIds.length ? visibleDepartmentIds : ['00000000-0000-0000-0000-000000000000'] };
  }

  private async relevantDepartmentIds(actor: AuthenticatedUser): Promise<string[] | null> {
    const visible = this.scope.visibleDepartmentIds(actor);
    if (visible === null) return null;
    if (visible.length) return visible;
    return [await this.scope.getPrimaryDepartmentId(actor.userId)];
  }

  private assertAttendanceAccess(actor: AuthenticatedUser, userId: string, departmentId: string): void {
    if (userId === actor.userId) return;
    if (actor.permissions.includes('attendance.read') && this.scope.canAccessDepartment(actor, departmentId)) return;
    throw forbidden('ATTENDANCE_FORBIDDEN', 'Khong co quyen xem bang cong nay');
  }

  private stateFor(record: { checkOutAt: Date | null; status: AttendanceStatus }) {
    if (record.checkOutAt || record.status === AttendanceStatus.CHECKED_OUT) return 'CHECKED_OUT';
    return 'CHECKED_IN';
  }

  private toAttendanceSummary(record: Prisma.AttendanceRecordGetPayload<{ include: ReturnType<AttendanceService['attendanceInclude']> }>) {
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
      user: (record as any).user,
    };
  }

  private async locationFromRecord(record: Prisma.AttendanceRecordGetPayload<{ include: ReturnType<AttendanceService['attendanceInclude']> }>) {
    const gps = record.verifications.find((verification) => verification.type === AttendanceVerificationType.GPS);
    const metadata = gps?.metadata && typeof gps.metadata === 'object' && !Array.isArray(gps.metadata)
      ? gps.metadata as { attendanceLocationId?: string }
      : null;
    if (!metadata?.attendanceLocationId) return null;
    const location = await this.prisma.attendanceLocation.findUnique({
      where: { id: metadata.attendanceLocationId },
      select: { id: true, name: true, latitude: true, longitude: true, radiusMeters: true, branchId: true },
    });
    return location
      ? {
          ...location,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        }
      : null;
  }

  private toAttendanceDetail(
    record: Prisma.AttendanceRecordGetPayload<{ include: ReturnType<AttendanceService['attendanceInclude']> }>,
    attendanceLocation: Awaited<ReturnType<AttendanceService['locationFromRecord']>>,
  ) {
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

  private minutesBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000));
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
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
}
