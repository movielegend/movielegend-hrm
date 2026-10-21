import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import moment from 'moment-timezone';
import { calculateCompanyLatePenalty } from '../attendance/attendance.service';

@Injectable()
export class AttendanceReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentScopeService,
  ) {}

  async getDetailedReport(
    query: { startDate: string; endDate: string; departmentId?: string; userId?: string },
    actor?: AuthenticatedUser,
  ) {
    const start = moment(query.startDate).startOf('day').toDate();
    const end = moment(query.endDate).endOf('day').toDate();

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const parseArray = (val: any): string[] | undefined => {
      if (!val || typeof val !== 'string' || val === 'undefined' || val === 'null' || val === 'all') return undefined;
      const arr = val
        .split(',')
        .map(s => s.trim())
        .filter(s => UUID_REGEX.test(s));
      return arr.length > 0 ? arr : undefined;
    };
    let deptIds = parseArray(query.departmentId);
    const uIds = parseArray(query.userId);

    // Apply regional department scoping if actor is provided
    if (actor) {
      const visibleDepts = await this.scope.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null) {
        const validVisibleDepts = visibleDepts.filter(id => UUID_REGEX.test(id));
        if (deptIds && deptIds.length > 0) {
          deptIds = deptIds.filter((id) => validVisibleDepts.includes(id));
          if (deptIds.length === 0) {
            deptIds = ['00000000-0000-0000-0000-000000000000'];
          }
        } else {
          deptIds = validVisibleDepts.length > 0 ? validVisibleDepts : ['00000000-0000-0000-0000-000000000000'];
        }
      }
    }

    const deptFilter = deptIds && deptIds.length > 0 ? { in: deptIds } : undefined;
    const userFilter = uIds && uIds.length > 0 ? { in: uIds } : undefined;

    // 1. Fetch data
    const users = await this.prisma.user.findMany({
      where: {
        ...(userFilter && { id: userFilter }),
        ...(deptFilter && {
          departmentLinks: {
            some: {
              departmentId: deptFilter,
              leftAt: null,
            }
          }
        }),
        roles: {
          none: {
            role: {
              code: 'ADMIN'
            }
          }
        }
      },
      include: {
        profile: true,
        departmentLinks: {
          where: { leftAt: null },
          include: { department: true }
        }
      }
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return {
        startDate: start,
        endDate: end,
        userGroups: [],
      };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        workDate: { gte: start, lte: end },
        userId: { in: userIds },
      },
      include: {
        shiftAssignment: { include: { shift: true } },
      },
    });

    // Fetch Overtimes from OvertimeRequest table, EmployeeRequest, and OtReport (Live), and AttendanceAdjustments
    const [overtimesDb, overtimesRaw, leavesDb, lateRequestsRaw, otReportsDb, adjustmentsDb, businessTripsRaw] = await Promise.all([
      this.prisma.overtimeRequest.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          workDate: { gte: start, lte: end },
        },
      }).catch(err => {
        console.warn('overtimeRequest query failed, falling back to empty list:', err?.message || err);
        return [];
      }),
      this.prisma.employeeRequest.findMany({
        where: {
          type: 'OVERTIME',
          status: 'APPROVED',
          userId: { in: userIds },
        },
      }).catch(() => []),
      this.prisma.leaveRequest.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          startDate: { lte: end },
          endDate: { gte: start },
        },
        include: {
          leaveType: true,
        },
      }).catch(() => []),
      this.prisma.employeeRequest.findMany({
        where: {
          type: { in: ['LATE_ARRIVAL', 'ATTENDANCE_ADJUSTMENT', 'LEAVE', 'OTHER', 'EARLY_LEAVE'] },
          status: 'APPROVED',
          userId: { in: userIds },
        },
      }).catch(() => []),
      this.prisma.otReport.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          otDate: { gte: start, lte: end },
        },
      }).catch(err => {
        console.warn('otReport table query skipped (table might not exist in database):', err?.message || err);
        return [];
      }),
      this.prisma.attendanceAdjustment.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
        },
        include: { attendanceRecord: true },
      }).catch(() => []),
      this.prisma.employeeRequest.findMany({
        where: {
          type: 'BUSINESS_TRIP',
          status: 'APPROVED',
          userId: { in: userIds },
        },
      }).catch(() => []),
    ]);

    const rawOvertimes = overtimesRaw.filter(o => {
      const meta: any = (o.attachmentMetadata && typeof o.attachmentMetadata === 'object') ? o.attachmentMetadata : {};
      const rawDate = meta.fromDate || meta.workDate || meta.rawOtDate || (meta.startTime ? moment(meta.startTime).format('YYYY-MM-DD') : null) || (o.createdAt ? moment(o.createdAt).format('YYYY-MM-DD') : null);
      if (!rawDate) return false;
      const otDate = moment.tz(rawDate, 'Asia/Ho_Chi_Minh');
      return otDate.isBetween(start, end, 'day', '[]');
    }).map(o => {
      const meta: any = (o.attachmentMetadata && typeof o.attachmentMetadata === 'object') ? o.attachmentMetadata : {};
      const rawDate = meta.fromDate || meta.workDate || meta.rawOtDate || (meta.startTime ? moment(meta.startTime).format('YYYY-MM-DD') : null) || (o.createdAt ? moment(o.createdAt).format('YYYY-MM-DD') : null);
      return {
        userId: o.userId,
        workDate: moment.tz(rawDate, 'Asia/Ho_Chi_Minh').toDate(),
        startAt: meta.startTime ? new Date(meta.startTime) : undefined,
        endAt: meta.endTime ? new Date(meta.endTime) : undefined,
        startTimeStr: meta.startTimeStr || meta.fromTime,
        endTimeStr: meta.endTimeStr || meta.toTime,
        proposedPercent: Number(meta.proposedPercent || meta.approvedPercent || meta.percent) || 100,
        validOtMinutes: Number(meta.validOtMinutes || meta.estimatedOtMinutes) || 0,
        reason: o.content || meta.reason,
        title: o.title,
      };
    });

    const dbOvertimes = overtimesDb.map(o => ({
      userId: o.userId,
      workDate: o.workDate,
      startAt: o.startAt,
      endAt: o.endAt,
      startTimeStr: undefined,
      endTimeStr: undefined,
      proposedPercent: 150,
      validOtMinutes: 0,
      reason: o.reason,
      title: 'Làm thêm giờ',
    }));

    const overtimes = [...rawOvertimes, ...dbOvertimes];

    const lateRequests = lateRequestsRaw.filter(o => {
      if (o.type !== 'LATE_ARRIVAL') return false;
      if (!o.attachmentMetadata || typeof o.attachmentMetadata !== 'object') return false;
      const meta: any = o.attachmentMetadata;
      if (!meta.fromDate) return false;
      const rDate = moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh');
      return rDate.isBetween(start, end, 'day', '[]');
    }).map(o => {
      const meta: any = o.attachmentMetadata;
      return {
        userId: o.userId,
        workDate: new Date(meta.fromDate),
      };
    });

    // Thu thập tất cả các đơn làm bù (COMPENSATORY_WORK) hợp lệ (trong cùng tháng)
    const allCompRequests = lateRequestsRaw.filter(r => {
      const meta: any = r.attachmentMetadata;
      const isComp = (r.type as string) === 'COMPENSATORY_WORK' || r.title?.includes('[LÀM BÙ]') || meta?.requestType === 'COMPENSATORY_WORK';
      return isComp && r.status === 'APPROVED' && meta && meta.compensationStatus !== 'CANCELLED' && !meta.cancellationApproved;
    });

    const userDateRecordMap = new Map<string, any>();
    for (const rec of records) {
      const dStr = moment.tz(rec.workDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      userDateRecordMap.set(`${rec.userId}_${dStr}`, rec);
    }

    const configs = await this.prisma.departmentOvertimeConfig.findMany();
    const configMap = new Map(configs.map(c => [c.departmentId, c]));

    const holidays = await this.prisma.companyHoliday.findMany({
      where: { date: { gte: start, lte: end } },
    });
    const holidayDates = new Set(holidays.map(h => moment(h.date).format('YYYY-MM-DD')));

    // 2. Process Data
    const report: any[] = [];
    const userGroups = new Map<string, any[]>();

    for (const user of users) {
      const liveDeptLink = user.departmentLinks?.find((d: any) =>
        Boolean(
          (d.department?.name && d.department.name.toLowerCase().includes('live')) ||
          (d.department?.code && d.department.code.toLowerCase().includes('live'))
        )
      );
      const primaryDeptLink = user.departmentLinks?.find((d: any) => d.isPrimary) || user.departmentLinks?.[0];
      const deptLink = liveDeptLink || primaryDeptLink;
      const deptId = deptLink?.departmentId;
      const deptName = deptLink?.department?.name || 'Không có';
      
      const config = configMap.get(deptId) || {
        weekdayMultiplier: 1.5,
        weekendMultiplier: 2.0,
        holidayMultiplier: 3.0,
        nightAllowanceAmount: 50000,
        nightStartHour: 21,
        lateDeductionAmount: 50000,
        lateThresholdMinutes: 5,
      };

      const userRecords = records.filter(r => r.userId === user.id);
      const userRows = [];

      // Loop through all dates
      const currDate = moment(start);
      const endDateMoment = moment(end);
      
      while (currDate.isSameOrBefore(endDateMoment, 'day')) {
        const dateStr = currDate.format('YYYY-MM-DD');
        const dayOfWeek = currDate.locale('vi').format('dddd');
        const isHoliday = holidayDates.has(dateStr);
        const isWeekend = dayOfWeek === 'Thứ bảy' || dayOfWeek === 'Chủ nhật';

        const dayRecords = userRecords.filter(r =>
          moment(r.workDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(r.workDate).format('YYYY-MM-DD') === dateStr
        );
        dayRecords.sort((a, b) => new Date(a.checkInAt).getTime() - new Date(b.checkInAt).getTime());

        const record = dayRecords[0];
        const isLiveDepartment = Boolean(
          (deptName && deptName.toLowerCase().includes('live')) ||
          (liveDeptLink !== undefined)
        );

        const otRequest = overtimes.find(o => o.userId === user.id && (
          moment(o.workDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(o.workDate).format('YYYY-MM-DD') === dateStr ||
          moment.tz(o.workDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') === dateStr
        ));

        const lateRequest = lateRequests.find(o => o.userId === user.id && (
          moment(o.workDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(o.workDate).format('YYYY-MM-DD') === dateStr
        ));

        const approvedLateAdjReq = lateRequestsRaw.find((lr) => {
          if (lr.userId !== user.id || lr.status !== 'APPROVED') return false;
          const meta: any = lr.attachmentMetadata;
          const fromDateStr = meta?.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          const checkInDateStr = meta?.requestedCheckInAt ? moment.tz(meta.requestedCheckInAt, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          const matchDate = fromDateStr === dateStr || checkInDateStr === dateStr || meta?.workDate === dateStr || (record && lr.referenceId === record.id);
          if (!matchDate) return false;
          return (
            lr.type === 'LATE_ARRIVAL' ||
            (lr.type === 'ATTENDANCE_ADJUSTMENT' && (
              meta?.explanationType?.toLowerCase().includes('muộn') ||
              lr.title?.toLowerCase().includes('muộn')
            ))
          );
        });

        const hasApprovedLateAdj = Boolean(lateRequest || approvedLateAdjReq);

        const liveOt = otReportsDb.find(o => o.userId === user.id && (
          moment(o.otDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(o.otDate).format('YYYY-MM-DD') === dateStr
        ));

        const businessTrip = businessTripsRaw.find(b => {
          if (b.userId !== user.id) return false;
          const meta: any = b.attachmentMetadata;
          if (!meta || !meta.fromDate) return false;
          const from = moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').startOf('day');
          const to = moment.tz(meta.toDate || meta.fromDate, 'Asia/Ho_Chi_Minh').endOf('day');
          return currDate.isSameOrAfter(from, 'day') && currDate.isSameOrBefore(to, 'day');
        });

        let checkIn = null;
        let checkOut = null;
        let totalMinutes = 0;
        let lateMins = 0;
        let earlyMins = 0;
        let ot100 = 0;
        let ot150 = 0;
        let ot200 = 0;
        let otMins = 0;
        let nightAllowance = 0;
        let lateDeduction = 0;
        let attendance = 0;

        const formatHrs = (mins: number) => {
          if (!mins) return '0:00:00';
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h}:${m.toString().padStart(2, '0')}:00`;
        };

        if (isLiveDepartment) {
          // QUY TẮC PHÒNG LIVE:
          // 1. Có check-in -> 1 công, nhiều lượt không cộng thêm công
          attendance = dayRecords.length > 0 ? 1 : 0;
          if (dayRecords.length > 0) {
            checkIn = dayRecords[0]?.checkInAt ? moment(dayRecords[0].checkInAt).tz('Asia/Ho_Chi_Minh') : null;
            const lastWithOut = [...dayRecords].reverse().find(r => r.checkOutAt);
            checkOut = lastWithOut?.checkOutAt
              ? moment(lastWithOut.checkOutAt).tz('Asia/Ho_Chi_Minh')
              : (dayRecords[dayRecords.length - 1]?.checkOutAt
                ? moment(dayRecords[dayRecords.length - 1].checkOutAt).tz('Asia/Ho_Chi_Minh')
                : null);

            // 2. Giờ thực tế = cộng thời gian các lượt đã hoàn tất của ngày đó, không tính khoảng nghỉ
            for (const r of dayRecords) {
              if (r.checkInAt && r.checkOutAt) {
                const diff = moment(r.checkOutAt).diff(moment(r.checkInAt), 'minutes');
                if (diff > 0) totalMinutes += diff;
              }
            }

            // 3. Tính đi muộn và tiền phạt theo quy định công ty nếu có ca hoặc có ghi nhận đi muộn
            for (const r of dayRecords) {
              if (r.lateMinutes && r.lateMinutes > 0) {
                lateMins += Number(r.lateMinutes);
              }
              if (r.latePenaltyAmount !== null && r.latePenaltyAmount !== undefined) {
                lateDeduction += Number(r.latePenaltyAmount);
              }
            }

            // Nếu có đi muộn mà tiền phạt chưa được lưu (bằng 0), tự động áp dụng bảng quy định phạt công ty
            if (lateMins > 0 && lateDeduction === 0 && !hasApprovedLateAdj) {
              lateDeduction = calculateCompanyLatePenalty(lateMins).amount;
            }

            if (hasApprovedLateAdj) {
              lateDeduction = 0;
            }

            // Hỗ trợ đêm nếu lượt cuối ra sau giờ đêm
            if (checkOut && checkOut.hour() >= Number(config.nightStartHour)) {
              nightAllowance = Number(config.nightAllowanceAmount);
            }
          }

          // 4. OT phòng Live: Ưu tiên OtReport đã duyệt, nếu không có OtReport thì dùng otRequest (đơn làm thêm tiêu chuẩn)
          if (liveOt && liveOt.validOtMinutes > 0) {
            otMins = liveOt.validOtMinutes;
            const pct = liveOt.approvedPercent || liveOt.proposedPercent || 100;
            if (pct === 100) ot100 = liveOt.validOtMinutes;
            else if (pct === 150) ot150 = liveOt.validOtMinutes;
            else if (pct === 200) ot200 = liveOt.validOtMinutes;
            else ot100 = liveOt.validOtMinutes;
          } else if (otRequest) {
            const approvedMinutes = Number(otRequest.validOtMinutes) || (otRequest.startAt && otRequest.endAt ? Math.max(0, moment(otRequest.endAt).diff(moment(otRequest.startAt), 'minutes')) : 0);
            if (approvedMinutes > 0) {
              otMins = approvedMinutes;
              const pct = Number(otRequest.proposedPercent) || 100;
              if (pct === 100) ot100 = approvedMinutes;
              else if (pct === 150) ot150 = approvedMinutes;
              else if (pct === 200) ot200 = approvedMinutes;
              else ot100 = approvedMinutes;
            }
          }
        } else {
          // CÁC PHÒNG BAN TIÊU CHUẨN:
          checkIn = record?.checkInAt ? moment(record.checkInAt).tz('Asia/Ho_Chi_Minh') : null;
          checkOut = record?.checkOutAt ? moment(record.checkOutAt).tz('Asia/Ho_Chi_Minh') : null;

          // Kiểm tra xem có đơn sửa công / giải trình bổ sung checkout được duyệt không
          const approvedAdj = adjustmentsDb.find(
            (a) => a.userId === user.id && (
              a.attendanceRecordId === record?.id ||
              (a.requestedCheckOutAt && moment(a.requestedCheckOutAt).format('YYYY-MM-DD') === dateStr)
            ),
          );
          const approvedAdjReq = lateRequestsRaw.find((r) => {
            const meta: any = r.attachmentMetadata;
            return (
              r.userId === user.id &&
              r.type === 'ATTENDANCE_ADJUSTMENT' &&
              (r.referenceId === record?.id || (meta && typeof meta === 'object' && meta.workDate === dateStr))
            );
          });

          const isApprovedAdjustment = Boolean(approvedAdj || approvedAdjReq);
          if (!checkOut && isApprovedAdjustment) {
            const reqOut = approvedAdj?.requestedCheckOutAt || (approvedAdjReq?.attachmentMetadata as any)?.requestedCheckOutAt;
            if (reqOut) {
              checkOut = moment(reqOut).tz('Asia/Ho_Chi_Minh');
            }
          }
          if (!checkIn && isApprovedAdjustment) {
            const reqIn = approvedAdj?.requestedCheckInAt || (approvedAdjReq?.attachmentMetadata as any)?.requestedCheckInAt;
            if (reqIn) {
              checkIn = moment(reqIn).tz('Asia/Ho_Chi_Minh');
            }
          }
          
          const shift = record?.shiftAssignment?.shift;
          if (checkIn && checkOut) {
            totalMinutes = checkOut.diff(checkIn, 'minutes');
            if (shift?.breakMinutes) totalMinutes -= shift.breakMinutes;
          }
          if (totalMinutes < 0) totalMinutes = 0;

          const isPastDate = currDate.isBefore(moment().tz('Asia/Ho_Chi_Minh'), 'day');
          const isMissCheckout = Boolean(checkIn && !checkOut && isPastDate && !isApprovedAdjustment);

          otMins = 0;
          if (!record && isApprovedAdjustment) {
            attendance = 1;
            totalMinutes = 480;
          }

          if (record) {
            if (isMissCheckout) {
              // Miss Checkout (qua 0:00 mà không check-out và chưa có đơn được duyệt): 0 CÔNG
              attendance = 0;
              totalMinutes = 0;
            } else if (isApprovedAdjustment) {
              // Đã duyệt đơn bổ sung check-out: 1 công
              attendance = 1;
            } else {
              attendance = record.latePenaltyWorkDays !== null ? Number(record.latePenaltyWorkDays) : (record.isUnplannedOt ? 0 : 1);
            }
            lateDeduction = record.latePenaltyAmount !== null ? Number(record.latePenaltyAmount) : 0;
            lateMins = record.lateMinutes !== null ? Number(record.lateMinutes) : 0;
            if (lateMins > 0 && lateDeduction === 0 && !hasApprovedLateAdj) {
              lateDeduction = calculateCompanyLatePenalty(lateMins).amount;
            }
            if (lateMins > 0 && hasApprovedLateAdj) {
              lateDeduction = 0;
            }

            if (!shift) {
              if (checkIn && checkOut && otRequest) {
                const approvedStart = moment(otRequest.startAt).tz('Asia/Ho_Chi_Minh');
                const approvedEnd = moment(otRequest.endAt).tz('Asia/Ho_Chi_Minh');
                const effectiveOtStart = checkIn.isBefore(approvedStart) ? approvedStart : checkIn;
                const effectiveOtEnd = checkOut.isAfter(approvedEnd) ? approvedEnd : checkOut;
                otMins = Math.max(0, effectiveOtEnd.diff(effectiveOtStart, 'minutes'));
              }
              if (otMins === 0 && otRequest) {
                const approvedMinutes = Number(otRequest.validOtMinutes) || (otRequest.startAt && otRequest.endAt ? Math.max(0, moment(otRequest.endAt).diff(moment(otRequest.startAt), 'minutes')) : 0);
                if (approvedMinutes > 0) otMins = approvedMinutes;
              }
            } else {
              const shiftStart = moment.tz(`${dateStr} ${shift.startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh');
              const shiftEnd = moment.tz(`${dateStr} ${shift.endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh');

              if (record.status === 'MISSING') {
                if (lateRequest || hasApprovedLateAdj) {
                  attendance = 1;
                  lateDeduction = 0;
                }
              } else {
                if (lateMins > 0 && hasApprovedLateAdj) {
                  lateDeduction = 0;
                  attendance = 1;
                }

                if (checkOut && checkOut.isBefore(shiftEnd) && !otRequest) {
                  earlyMins = shiftEnd.diff(checkOut, 'minutes');
                }

                if (checkOut && checkOut.isAfter(shiftEnd) && otRequest) {
                  const approvedEnd = moment(otRequest.endAt).tz('Asia/Ho_Chi_Minh');
                  const effectiveOtEnd = checkOut.isAfter(approvedEnd) ? approvedEnd : checkOut;
                  otMins = Math.max(0, effectiveOtEnd.diff(shiftEnd, 'minutes'));
                }
              }
            }
          }

          if (!record && otRequest) {
            const approvedMinutes = Number(otRequest.validOtMinutes) || (otRequest.startAt && otRequest.endAt ? Math.max(0, moment(otRequest.endAt).diff(moment(otRequest.startAt), 'minutes')) : 0);
            if (approvedMinutes > 0) {
              otMins = approvedMinutes;
            }
          }

          if (checkOut && checkOut.hour() >= Number(config.nightStartHour)) {
            nightAllowance = Number(config.nightAllowanceAmount);
          }

          if (otMins > 0) {
            const pct = Number(otRequest?.proposedPercent) || (isHoliday || isWeekend ? 200 : 150);
            if (pct === 100) ot100 = otMins;
            else if (pct === 200) ot200 = otMins;
            else ot150 = otMins;
          }
        }

        let checkInDisplay = checkIn ? checkIn.format('HH:mm') : '';
        let checkOutDisplay = checkOut ? checkOut.format('HH:mm') : '';

        if (businessTrip) {
          const tripMeta: any = businessTrip.attachmentMetadata || {};
          const parseTripTime = (timeVal: any, fallback: string) => {
            if (!timeVal) return fallback;
            if (typeof timeVal === 'string') {
              if (timeVal.includes('T') || timeVal.includes('Z')) {
                const m = moment(timeVal).tz('Asia/Ho_Chi_Minh');
                if (m.isValid()) return m.format('HH:mm');
              }
              if (timeVal.includes(':')) {
                const parts = timeVal.split(':');
                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
              }
            }
            return fallback;
          };

          const tripStart = parseTripTime(tripMeta.startTime, '08:00');
          const tripEnd = parseTripTime(tripMeta.endTime, '17:20');

          checkInDisplay = tripStart;
          checkOutDisplay = tripEnd;

          // Calculate trip working minutes
          const [sh, sm] = tripStart.split(':').map(Number);
          const [eh, em] = tripEnd.split(':').map(Number);
          let tripMins = (eh * 60 + em) - (sh * 60 + sm);
          if (tripMins > 300) {
            tripMins = Math.max(480, tripMins - 60);
          }
          if (tripMins <= 0) tripMins = 480;

          totalMinutes = tripMins;
          attendance = 1;
          lateDeduction = 0;
          lateMins = 0;
          earlyMins = 0;
        }

        // Kiểm tra đơn nghỉ phép được duyệt từ bảng LeaveRequest
        const approvedLeaveDb = leavesDb.find(l => {
          if (l.userId !== user.id) return false;
          const s = moment.tz(l.startDate, 'Asia/Ho_Chi_Minh').startOf('day');
          const e = moment.tz(l.endDate, 'Asia/Ho_Chi_Minh').endOf('day');
          return currDate.isSameOrAfter(s, 'day') && currDate.isSameOrBefore(e, 'day');
        });

        // Kiểm tra đơn nghỉ phép được duyệt từ bảng EmployeeRequest (type: LEAVE)
        const approvedLeaveReq = lateRequestsRaw.find(r => {
          if (r.userId !== user.id || r.type !== 'LEAVE') return false;
          const meta: any = r.attachmentMetadata;
          if (!meta) return false;
          const from = meta.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').startOf('day') : null;
          const to = meta.toDate ? moment.tz(meta.toDate, 'Asia/Ho_Chi_Minh').endOf('day') : from;
          if (!from) return false;
          return currDate.isSameOrAfter(from, 'day') && currDate.isSameOrBefore(to, 'day');
        });

        const isLeaveForDay = Boolean(approvedLeaveDb || approvedLeaveReq);
        let leaveTypeName = '';
        let isLeavePaid = false;
        let isHalfDay = false;
        let isHourlyLeave = false;
        let leaveReason = '';
        let leaveStartTime: any = null;
        let leaveEndTime: any = null;
        let leaveStartStr: string | undefined = undefined;
        let leaveEndStr: string | undefined = undefined;

        if (approvedLeaveDb) {
          leaveTypeName = approvedLeaveDb.leaveType?.name || 'Nghỉ phép';
          isLeavePaid = approvedLeaveDb.leaveType?.isPaid ?? true;
          isHalfDay = Number(approvedLeaveDb.totalDays) === 0.5;
          leaveReason = approvedLeaveDb.reason || '';
        } else if (approvedLeaveReq) {
          const meta: any = approvedLeaveReq.attachmentMetadata || {};
          leaveTypeName = meta.leaveType || 'Nghỉ phép';
          const duration = meta.leaveDurationType || 'Trong ngày';
          isHourlyLeave = duration === 'Theo giờ';
          isHalfDay = duration === 'Nửa ngày' || duration === '1/2 ngày';
          leaveReason = approvedLeaveReq.content || '';
          leaveStartTime = meta.startTime;
          leaveEndTime = meta.endTime;
          leaveStartStr = meta.startTimeStr || meta.fromTime;
          leaveEndStr = meta.endTimeStr || meta.toTime;

          if ((!leaveStartTime || !leaveEndTime) && approvedLeaveReq.title) {
            const timeMatch = approvedLeaveReq.title.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            if (timeMatch) {
              leaveStartStr = timeMatch[1];
              leaveEndStr = timeMatch[2];
            }
          }

          const lowerName = leaveTypeName.toLowerCase();
          if (lowerName.includes('không lương') || lowerName.includes('ốm') || lowerName.includes('thai sản')) {
            isLeavePaid = false;
          } else {
            isLeavePaid = true;
          }
        }

        let isDailyLeave = isLeaveForDay && !isHourlyLeave;

        if (isDailyLeave) {
          // Nghỉ theo ngày (Cả ngày / Nửa ngày / Nhiều ngày) đã được duyệt:
          // 1. Giờ check-in và check-out KHÔNG có giờ (để trống)
          checkInDisplay = '';
          checkOutDisplay = '';

          // 2. Không tính vi phạm giờ làm
          totalMinutes = 0;
          lateMins = 0;
          earlyMins = 0;
          lateDeduction = 0;

          // 3. Tính công theo chế độ có lương hay không
          attendance = isLeavePaid ? (isHalfDay ? 0.5 : 1) : 0;
        }

        const isPastDate = currDate.isBefore(moment().tz('Asia/Ho_Chi_Minh'), 'day');
        const isStandardMissCheckout = !isLiveDepartment && !businessTrip && !isDailyLeave && Boolean(checkIn && !checkOut && isPastDate);
        if (!checkOutDisplay && isStandardMissCheckout) {
          checkOutDisplay = 'Miss checkout';
        }

        // Helper format time HH:mm
        const formatOtTime = (timeVal: any, timeStr?: string): string => {
          if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
            const parts = timeStr.trim().split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
          if (!timeVal) return '';
          if (typeof timeVal === 'string' && /^\d{1,2}:\d{2}$/.test(timeVal.trim())) {
            const parts = timeVal.trim().split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
          const m = moment(timeVal);
          if (m.isValid()) {
            return m.tz('Asia/Ho_Chi_Minh').format('HH:mm');
          }
          return '';
        };

        const noteParts: string[] = [];
        if (hasApprovedLateAdj && !isDailyLeave) {
          const lateReq = lateRequestsRaw.find((lr) => {
            if (lr.userId !== user.id || lr.status !== 'APPROVED') return false;
            const meta: any = lr.attachmentMetadata;
            const fromDateStr = meta?.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
            const checkInDateStr = meta?.requestedCheckInAt ? moment.tz(meta.requestedCheckInAt, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
            return fromDateStr === dateStr || checkInDateStr === dateStr || meta?.workDate === dateStr || (record && lr.referenceId === record.id);
          });
          const meta: any = lateReq?.attachmentMetadata || {};
          const inTime = formatOtTime(meta.startTime || meta.requestedCheckInAt, meta.startTimeStr) || (checkIn ? checkIn.format('HH:mm') : '');
          const reason = meta.reason || lateReq?.content || '';
          const reasonText = reason ? `: ${reason}` : '';
          const lateDetail = inTime ? ` (Vào lúc: ${inTime}${lateMins > 0 ? ` - Muộn ${lateMins}p` : ''}${reasonText})` : (lateMins > 0 ? ` (Muộn ${lateMins}p${reasonText})` : (reasonText ? ` (${reason})` : ''));

          if (lateReq && lateReq.type === 'ATTENDANCE_ADJUSTMENT') {
            const expType = meta.explanationType || 'Check-in muộn';
            noteParts.push(`Giải trình: ${expType} được chấp thuận${lateDetail}`);
          } else {
            noteParts.push(`Đi muộn được chấp thuận${lateDetail}`);
          }
          if (record?.notes && !record.notes.toLowerCase().includes('muộn')) {
            noteParts.push(record.notes);
          }
        } else {
          if (record?.notes) noteParts.push(record.notes);
        }
        if (businessTrip) {
          const bMeta: any = businessTrip.attachmentMetadata || {};
          const loc = bMeta.location;
          const purpose = bMeta.purpose || businessTrip.content || '';
          const sTime = formatOtTime(bMeta.startTime) || '08:00';
          const eTime = formatOtTime(bMeta.endTime) || '17:30';
          const timeStr = ` (${sTime} - ${eTime})`;
          const purposeStr = purpose ? ` (Mục đích: ${purpose})` : '';
          noteParts.push(`Công tác: ${loc || 'Bên ngoài'}${timeStr}${purposeStr}`);
        }
        if (isStandardMissCheckout) {
          noteParts.push('Quên check-out');
        }

        const approvedEarlyReq = lateRequestsRaw.find((er) => {
          if (er.userId !== user.id || er.status !== 'APPROVED' || er.type !== 'EARLY_LEAVE') return false;
          const meta: any = er.attachmentMetadata;
          const fromDateStr = meta?.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          return fromDateStr === dateStr || meta?.workDate === dateStr;
        });

        if (approvedEarlyReq && !isDailyLeave) {
          const meta: any = approvedEarlyReq.attachmentMetadata || {};
          const outTime = formatOtTime(meta.endTime || meta.requestedCheckOutAt, meta.endTimeStr) || (checkOut ? checkOut.format('HH:mm') : '');
          const reason = meta.reason || approvedEarlyReq.content || '';
          const reasonText = reason ? `: ${reason}` : '';
          const earlyDetail = outTime ? ` (Về lúc: ${outTime}${earlyMins > 0 ? ` - Sớm ${earlyMins}p` : ''}${reasonText})` : (earlyMins > 0 ? ` (Sớm ${earlyMins}p${reasonText})` : (reasonText ? ` (${reason})` : ''));
          noteParts.push(`Về sớm được chấp thuận${earlyDetail}`);
          earlyMins = 0;
        }

        const approvedAdjDay = lateRequestsRaw.find((ar) => {
          if (ar.userId !== user.id || ar.status !== 'APPROVED' || ar.type !== 'ATTENDANCE_ADJUSTMENT') return false;
          const meta: any = ar.attachmentMetadata;
          const fromDateStr = meta?.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          const checkInDateStr = meta?.requestedCheckInAt ? moment.tz(meta.requestedCheckInAt, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          return fromDateStr === dateStr || checkInDateStr === dateStr || meta?.workDate === dateStr || (record && ar.referenceId === record.id);
        });

        if (approvedAdjDay && !isDailyLeave && !hasApprovedLateAdj) {
          const meta: any = approvedAdjDay.attachmentMetadata || {};
          const expType = meta.explanationType || 'Giải trình chấm công';
          const inTime = formatOtTime(meta.requestedCheckInAt, meta.startTimeStr);
          const outTime = formatOtTime(meta.requestedCheckOutAt, meta.endTimeStr);
          const reason = meta.reason || approvedAdjDay.content || '';
          const reasonText = reason ? `: ${reason}` : '';

          let detailTime = '';
          if (expType === 'Quên Check-in' && inTime) {
            detailTime = ` (Giờ vào: ${inTime}${reasonText})`;
          } else if (expType === 'Quên Check-out' && outTime) {
            detailTime = ` (Giờ ra: ${outTime}${reasonText})`;
          } else if (inTime && outTime) {
            detailTime = ` (${inTime} - ${outTime}${reasonText})`;
          } else if (inTime) {
            detailTime = ` (Giờ vào: ${inTime}${reasonText})`;
          } else if (outTime) {
            detailTime = ` (Giờ ra: ${outTime}${reasonText})`;
          } else if (reasonText) {
            detailTime = ` (${reason})`;
          }

          noteParts.push(`Giải trình: ${expType} được chấp thuận${detailTime}`);
          if (meta.explanationType && meta.explanationType.includes('sớm')) {
            earlyMins = 0;
          }
        }

        const approvedOtherReq = lateRequestsRaw.find((otr) => {
          if (otr.userId !== user.id || otr.status !== 'APPROVED' || otr.type !== 'OTHER') return false;
          const meta: any = otr.attachmentMetadata;
          const fromDateStr = meta?.fromDate ? moment.tz(meta.fromDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          return fromDateStr === dateStr || meta?.workDate === dateStr;
        });

        if (approvedOtherReq && !isDailyLeave) {
          const otherMeta: any = approvedOtherReq.attachmentMetadata || {};
          const otherTitle = approvedOtherReq.title || 'Yêu cầu hành chính';
          const otherContent = approvedOtherReq.content || otherMeta.reason || '';
          noteParts.push(`Đơn khác: ${otherTitle}${otherContent ? ` (${otherContent})` : ''}`);
        }
        if (isDailyLeave) {
          const halfDayText = isHalfDay ? ' (Nửa ngày)' : '';
          const reason = leaveReason?.trim();
          const reasonSuffix = reason ? ` (Lý do: ${reason})` : '';
          const sTime = formatOtTime(leaveStartTime, leaveStartStr);
          const eTime = formatOtTime(leaveEndTime, leaveEndStr);
          const timeRange = isHalfDay && sTime && eTime ? ` (${sTime} - ${eTime})` : '';
          noteParts.push(`Nghỉ phép${halfDayText}: ${leaveTypeName}${timeRange}${reasonSuffix}`);
        } else if (isHourlyLeave) {
          const sTime = formatOtTime(leaveStartTime, leaveStartStr);
          const eTime = formatOtTime(leaveEndTime, leaveEndStr);
          const timeRange = sTime && eTime ? ` (Từ ${sTime} - ${eTime})` : (sTime ? ` (Từ ${sTime})` : '');
          const reason = leaveReason?.trim();
          const reasonSuffix = reason ? ` (Lý do: ${reason})` : '';
          noteParts.push(`Nghỉ theo giờ: ${leaveTypeName}${timeRange}${reasonSuffix}`);
        }

        if (isLiveDepartment && liveOt && liveOt.validOtMinutes > 0) {
          const pct = liveOt.approvedPercent || liveOt.proposedPercent || 100;
          const sTime = formatOtTime(liveOt.startTime);
          const eTime = formatOtTime(liveOt.endTime);
          const timeRange = sTime && eTime ? ` (${sTime} - ${eTime})` : '';
          const reason = liveOt.reason?.trim();
          const reasonSuffix = reason ? ` (Lý do: ${reason})` : '';
          noteParts.push(`Đơn OT ca Live${timeRange} (${pct}%) đã được duyệt${reasonSuffix}`);
        }
        if (otMins > 0 && otRequest) {
          const pct = Number(otRequest.proposedPercent) || (isHoliday || isWeekend ? 200 : 150);
          const sTime = formatOtTime(otRequest.startAt, (otRequest as any).startTimeStr);
          const eTime = formatOtTime(otRequest.endAt, (otRequest as any).endTimeStr);
          const timeRange = sTime && eTime ? ` (${sTime} - ${eTime})` : '';
          const reason = otRequest.reason?.trim();
          const hasCustomReason = reason && !['làm thêm giờ', 'tăng ca', 'ot'].includes(reason.toLowerCase()) && !reason.startsWith('Làm thêm giờ');
          const reasonSuffix = hasCustomReason ? ` (Lý do: ${reason})` : '';
          noteParts.push(`Đơn OT${timeRange} (${pct}%) đã được duyệt${reasonSuffix}`);
        }

        // 1. Kiểm tra ngày hiện tại có phải là Ngày nghỉ được bù (targetLeaveDate - Ngày A) không
        const approvedCompForTarget = allCompRequests.find(r => {
          if (r.userId !== user.id) return false;
          const meta: any = r.attachmentMetadata;
          if (!meta || meta.compensationStatus === 'CANCELLED' || meta.cancellationApproved) return false;
          const target = meta.targetLeaveDate ? moment.tz(meta.targetLeaveDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          return target === dateStr;
        });

        if (approvedCompForTarget) {
          const metaTarget: any = approvedCompForTarget.attachmentMetadata || {};
          const compShifts: Array<{ date: string; shiftId?: string; shiftName?: string; rate?: number; hours?: number }> =
            Array.isArray(metaTarget.compensationShifts) && metaTarget.compensationShifts.length > 0
              ? metaTarget.compensationShifts
              : (metaTarget.compensatoryDate
                ? [{
                    date: moment.tz(metaTarget.compensatoryDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD'),
                    shiftName: metaTarget.compensatoryShiftName || 'Ca làm việc',
                    rate: metaTarget.compensatoryRate || (metaTarget.compensatoryType === 'Theo giờ' && metaTarget.missedHours ? Math.min(1, metaTarget.missedHours / 8) : 1),
                    hours: metaTarget.missedHours || 8,
                  }]
                : []);

          const targetExpectedRate = Number(metaTarget.targetLeaveRate) ||
            (metaTarget.leaveDurationType === '1/2 ngày' || metaTarget.leaveDurationType === 'Nửa ngày'
              ? 0.5
              : (metaTarget.leaveDurationType === 'Theo giờ' && metaTarget.missedHours
                ? Math.min(1, metaTarget.missedHours / 8)
                : 1.0));

          let totalEarnedRate = 0;
          const completedNotes: string[] = [];
          const missedNotes: string[] = [];

          for (const s of compShifts) {
            if (!s.date) continue;
            const sDateStr = moment.tz(s.date, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
            const sDateDisplay = moment.tz(s.date, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
            const shiftName = s.shiftName || 'Ca làm';
            const sRate = Number(s.rate) || (s.hours ? s.hours / 8 : 1.0);

            const dayRec = userDateRecordMap.get(`${user.id}_${sDateStr}`);
            const hasWorked = Boolean(
              dayRec && dayRec.checkInAt && (isLiveDepartment || dayRec.checkOutAt || dayRec.status === 'ADJUSTED')
            );

            if (hasWorked) {
              totalEarnedRate += sRate;
              completedNotes.push(`${shiftName} (${sDateDisplay}) [+${sRate} công]`);
            } else {
              missedNotes.push(`${shiftName} (${sDateDisplay})`);
            }
          }

          const finalRate = Math.min(targetExpectedRate, Math.round(totalEarnedRate * 100) / 100);
          attendance = finalRate;
          isDailyLeave = true;
          checkInDisplay = '';
          checkOutDisplay = '';
          totalMinutes = 0;
          lateDeduction = 0;
          lateMins = 0;
          earlyMins = 0;

          if (finalRate >= targetExpectedRate) {
            noteParts.push(`Nghỉ làm bù (Đã bù đủ ${finalRate} công: ${completedNotes.join('; ')})`);
          } else if (finalRate > 0) {
            noteParts.push(`Nghỉ làm bù (Đã bù ${finalRate}/${targetExpectedRate} công: ${completedNotes.join('; ')} | Vắng/Chưa làm: ${missedNotes.join('; ')})`);
          } else {
            noteParts.push(`Nghỉ làm bù (Chưa/Không làm bù: ${missedNotes.join('; ')} - Không tính công)`);
          }
        }

        // 2. Kiểm tra ngày hiện tại có phải là Ngày làm bù (trong compensationShifts hoặc compensatoryDate) không
        const approvedCompForCompDate = allCompRequests.find(r => {
          if (r.userId !== user.id) return false;
          const meta: any = r.attachmentMetadata;
          if (!meta || meta.compensationStatus === 'CANCELLED' || meta.cancellationApproved) return false;
          if (Array.isArray(meta.compensationShifts) && meta.compensationShifts.length > 0) {
            return meta.compensationShifts.some((s: any) => moment.tz(s.date, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') === dateStr);
          }
          const cDate = meta.compensatoryDate ? moment.tz(meta.compensatoryDate, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') : null;
          return cDate === dateStr;
        });

        if (approvedCompForCompDate) {
          const metaB: any = approvedCompForCompDate.attachmentMetadata || {};
          const targetDateStr = metaB.targetLeaveDate ? moment.tz(metaB.targetLeaveDate, 'Asia/Ho_Chi_Minh').format('DD/MM/YYYY') : '';
          const matchedShift = Array.isArray(metaB.compensationShifts)
            ? metaB.compensationShifts.find((s: any) => moment.tz(s.date, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD') === dateStr)
            : null;
          const shiftRate = matchedShift ? Number(matchedShift.rate) : (Number(metaB.compensatoryRate) || 1.0);

          const hasWorkedCurrent = Boolean(
            record && record.checkInAt && (isLiveDepartment || record.checkOutAt || record.status === 'ADJUSTED')
          );

          if (hasWorkedCurrent) {
            noteParts.push(`Đi làm bù cho ngày ${targetDateStr} (+${shiftRate} công đã chuyển về ngày ${targetDateStr})`);
            // Chuyển công về ngày nghỉ A nên ngày bù ghi nhận 0 công để tránh nhân đôi công trong tháng
            attendance = 0;
          } else {
            noteParts.push(`Ca làm bù cho ngày ${targetDateStr} (${shiftRate} công - Vắng mặt / Không chấm công)`);
            attendance = 0;
          }

          // Khóa OT cho ca làm bù (không tính vào OT x150%/x200%)
          ot100 = 0;
          ot150 = 0;
          ot200 = 0;
        }
        const rowNotes = noteParts.join(' | ');

        const row = {
          employeeCode: user.userCode || '',
          employeeName: user.profile?.fullName || user.email || user.phone || user.userCode,
          department: deptName,
          position: '',
          date: currDate.format('DD/MM/YYYY'),
          dayOfWeek,
          checkIn: isDailyLeave ? '' : checkInDisplay,
          checkOut: isDailyLeave ? '' : checkOutDisplay,
          attendance: (dayRecords.length > 0 || businessTrip || isDailyLeave || Boolean(approvedAdjDay)) ? attendance : 0,
          totalHours: formatHrs(totalMinutes),
          overtime100: formatHrs(ot100),
          overtime150: formatHrs(ot150 + ot200),
          overtime200: formatHrs(ot200),
          lateMorning: checkIn && checkIn.hour() < 12 ? formatHrs(lateMins) : '0:00:00',
          lateAfternoon: checkIn && checkIn.hour() >= 12 ? formatHrs(lateMins) : '0:00:00',
          totalLate: formatHrs(lateMins),
          earlyLeave: formatHrs(earlyMins),
          totalLateAndEarly: formatHrs(lateMins + earlyMins),
          lateDeduction,
          nightAllowance,
          notes: rowNotes,
          
          // Raw values for summary
          _rawTotalHours: totalMinutes,
          _rawOt100: ot100,
          _rawOt150: ot150,
          _rawOt200: ot200,
          _rawLate: lateMins,
          _rawEarly: earlyMins,
        };

        userRows.push(row);
        currDate.add(1, 'day');
      }
      
      userGroups.set(user.id, userRows);
    }

    return {
      startDate: start,
      endDate: end,
      userGroups: Array.from(userGroups.values()),
    };
  }
}
