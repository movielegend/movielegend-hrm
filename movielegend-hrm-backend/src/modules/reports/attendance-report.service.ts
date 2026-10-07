import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import moment from 'moment-timezone';

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

    const parseArray = (val: any) => typeof val === 'string' ? val.split(',').filter(Boolean) : undefined;
    let deptIds = parseArray(query.departmentId);
    const uIds = parseArray(query.userId);

    // Apply regional department scoping if actor is provided
    if (actor) {
      const visibleDepts = await this.scope.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null) {
        if (deptIds && deptIds.length > 0) {
          deptIds = deptIds.filter((id) => visibleDepts.includes(id));
          if (deptIds.length === 0) {
            deptIds = ['00000000-0000-0000-0000-000000000000'];
          }
        } else {
          deptIds = visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'];
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
    const [overtimesDb, overtimesRaw, leavesDb, lateRequestsRaw, otReportsDb, adjustmentsDb] = await Promise.all([
      this.prisma.overtimeRequest.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          workDate: { gte: start, lte: end },
        },
      }),
      this.prisma.employeeRequest.findMany({
        where: {
          type: 'OVERTIME',
          status: 'APPROVED',
          userId: { in: userIds },
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      this.prisma.employeeRequest.findMany({
        where: {
          type: { in: ['LATE_ARRIVAL', 'ATTENDANCE_ADJUSTMENT', 'LEAVE'] },
          status: 'APPROVED',
          userId: { in: userIds },
        },
      }),
      this.prisma.otReport.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
          otDate: { gte: start, lte: end },
        },
      }),
      this.prisma.attendanceAdjustment.findMany({
        where: {
          status: 'APPROVED',
          userId: { in: userIds },
        },
        include: { attendanceRecord: true },
      }),
    ]);

    const overtimes = [
      ...overtimesDb.map(o => ({
        userId: o.userId,
        workDate: o.workDate,
        startAt: o.startAt,
        endAt: o.endAt,
      })),
      ...overtimesRaw.filter(o => {
        if (!o.attachmentMetadata || typeof o.attachmentMetadata !== 'object') return false;
        const meta: any = o.attachmentMetadata;
        if (!meta.fromDate) return false;
        const otDate = moment(meta.fromDate);
        return otDate.isBetween(start, end, 'day', '[]');
      }).map(o => {
        const meta: any = o.attachmentMetadata;
        return {
          userId: o.userId,
          workDate: new Date(meta.fromDate),
          startAt: new Date(meta.startTime),
          endAt: new Date(meta.endTime),
        };
      }),
    ];

    const lateRequests = [
      ...leavesDb.map(l => ({
        userId: l.userId,
        workDate: l.startDate,
      })),
      ...lateRequestsRaw.filter(o => {
        if (!o.attachmentMetadata || typeof o.attachmentMetadata !== 'object') return false;
        const meta: any = o.attachmentMetadata;
        if (!meta.fromDate) return false;
        const rDate = moment(meta.fromDate);
        return rDate.isBetween(start, end, 'day', '[]');
      }).map(o => {
        const meta: any = o.attachmentMetadata;
        return {
          userId: o.userId,
          workDate: new Date(meta.fromDate),
        };
      }),
    ];


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
          moment.utc(o.workDate).format('YYYY-MM-DD') === dateStr
        ));

        const lateRequest = lateRequests.find(o => o.userId === user.id && (
          moment(o.workDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(o.workDate).format('YYYY-MM-DD') === dateStr
        ));

        const liveOt = otReportsDb.find(o => o.userId === user.id && (
          moment(o.otDate).format('YYYY-MM-DD') === dateStr ||
          moment.utc(o.otDate).format('YYYY-MM-DD') === dateStr
        ));

        let checkIn = null;
        let checkOut = null;
        let totalMinutes = 0;
        let lateMins = 0;
        let earlyMins = 0;
        let ot100 = 0;
        let ot150 = 0;
        let ot200 = 0;
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

            // 3. Không áp dụng đi muộn theo ca cho phòng Live
            lateMins = 0;
            earlyMins = 0;
            lateDeduction = 0;

            // 4. OT phòng Live lấy từ OtReport đã duyệt (theo % leader duyệt)
            if (liveOt && liveOt.validOtMinutes > 0) {
              const pct = liveOt.approvedPercent || liveOt.proposedPercent || 100;
              if (pct === 100) ot100 = liveOt.validOtMinutes;
              else if (pct === 150) ot150 = liveOt.validOtMinutes;
              else if (pct === 200) ot200 = liveOt.validOtMinutes;
              else ot100 = liveOt.validOtMinutes;
            }

            // Hỗ trợ đêm nếu lượt cuối ra sau giờ đêm
            if (checkOut && checkOut.hour() >= Number(config.nightStartHour)) {
              nightAllowance = Number(config.nightAllowanceAmount);
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
          
          const shift = record?.shiftAssignment?.shift;
          if (checkIn && checkOut) {
            totalMinutes = checkOut.diff(checkIn, 'minutes');
            if (shift?.breakMinutes) totalMinutes -= shift.breakMinutes;
          }
          if (totalMinutes < 0) totalMinutes = 0;

          const isPastDate = currDate.isBefore(moment().tz('Asia/Ho_Chi_Minh'), 'day');
          const isMissCheckout = Boolean(checkIn && !checkOut && isPastDate && !isApprovedAdjustment);

          let otMins = 0;
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

            if (!shift) {
              if (checkIn && checkOut && otRequest) {
                const approvedStart = moment(otRequest.startAt).tz('Asia/Ho_Chi_Minh');
                const approvedEnd = moment(otRequest.endAt).tz('Asia/Ho_Chi_Minh');
                const effectiveOtStart = checkIn.isBefore(approvedStart) ? approvedStart : checkIn;
                const effectiveOtEnd = checkOut.isAfter(approvedEnd) ? approvedEnd : checkOut;
                otMins = Math.max(0, effectiveOtEnd.diff(effectiveOtStart, 'minutes'));
              }
            } else {
              const shiftStart = moment.tz(`${dateStr} ${shift.startTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh');
              const shiftEnd = moment.tz(`${dateStr} ${shift.endTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh');

              if (record.status === 'MISSING') {
                if (lateRequest) {
                  attendance = 1;
                  lateDeduction = 0;
                }
              } else {
                if (lateMins > 0 && lateRequest) {
                  if (record.latePenaltyLevel === null || record.latePenaltyLevel <= 3) {
                    lateDeduction = 0;
                    attendance = 1;
                  } else if (record.latePenaltyLevel === 4) {
                    lateDeduction = 50000;
                    attendance = 1;
                  }
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

          if (checkOut && checkOut.hour() >= Number(config.nightStartHour)) {
            nightAllowance = Number(config.nightAllowanceAmount);
          }

          if (otMins > 0) {
            if (isHoliday || isWeekend) ot200 = otMins;
            else ot150 = otMins;
          }
        }

        const isPastDate = currDate.isBefore(moment().tz('Asia/Ho_Chi_Minh'), 'day');
        const isStandardMissCheckout = !isLiveDepartment && Boolean(checkIn && !checkOut && isPastDate);

        const row = {
          employeeCode: user.userCode || '',
          employeeName: user.profile?.fullName || user.email || user.phone || user.userCode,
          department: deptName,
          position: '',
          date: currDate.format('DD/MM/YYYY'),
          dayOfWeek,
          checkIn: checkIn ? checkIn.format('HH:mm') : '',
          checkOut: checkOut ? checkOut.format('HH:mm') : isStandardMissCheckout ? 'Miss checkout' : '',
          attendance: dayRecords.length > 0 ? attendance : 0,
          totalHours: formatHrs(totalMinutes),
          overtime100: formatHrs(ot100),
          overtime150: formatHrs(ot150),
          overtime200: formatHrs(ot200),
          lateMorning: checkIn && checkIn.hour() < 12 ? formatHrs(lateMins) : '0:00:00',
          lateAfternoon: checkIn && checkIn.hour() >= 12 ? formatHrs(lateMins) : '0:00:00',
          totalLate: formatHrs(lateMins),
          earlyLeave: formatHrs(earlyMins),
          totalLateAndEarly: formatHrs(lateMins + earlyMins),
          lateDeduction,
          nightAllowance,
          
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
