import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as moment from 'moment-timezone';

@Injectable()
export class AttendanceReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetailedReport(query: { startDate: string; endDate: string; departmentId?: string; userId?: string }) {
    const start = moment(query.startDate).startOf('day').toDate();
    const end = moment(query.endDate).endOf('day').toDate();

    const parseArray = (val: any) => typeof val === 'string' ? val.split(',').filter(Boolean) : undefined;
    const deptIds = parseArray(query.departmentId);
    const uIds = parseArray(query.userId);

    const deptFilter = deptIds && deptIds.length > 0 ? { in: deptIds } : undefined;
    const userFilter = uIds && uIds.length > 0 ? { in: uIds } : undefined;

    // 1. Fetch data
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        workDate: { gte: start, lte: end },
        ...(deptFilter && { departmentId: deptFilter }),
        ...(userFilter && { userId: userFilter }),
      },
      include: {
        user: { include: { profile: true } },
        department: true,
        shiftAssignment: { include: { shift: true } },
      },
      orderBy: [{ userId: 'asc' }, { workDate: 'asc' }],
    });

    const userIds = [...new Set(records.map(r => r.userId))];

    const overtimes = await this.prisma.overtimeRequest.findMany({
      where: {
        status: 'APPROVED',
        userId: { in: userIds },
        workDate: { gte: start, lte: end },
      },
    });

    const configs = await this.prisma.departmentOvertimeConfig.findMany();
    const configMap = new Map(configs.map(c => [c.departmentId, c]));

    const holidays = await this.prisma.companyHoliday.findMany({
      where: { date: { gte: start, lte: end } },
    });
    const holidayDates = new Set(holidays.map(h => moment(h.date).format('YYYY-MM-DD')));

    // 2. Process Data
    const report: any[] = [];
    const userGroups = new Map<string, any[]>();

    for (const record of records) {
      const dateStr = moment(record.workDate).format('YYYY-MM-DD');
      const dayOfWeek = moment(record.workDate).locale('vi').format('dddd'); // Thứ ...
      
      const config = configMap.get(record.departmentId) || {
        weekdayMultiplier: 1.5,
        weekendMultiplier: 2.0,
        holidayMultiplier: 3.0,
        nightAllowanceAmount: 50000,
        nightStartHour: 21,
        lateDeductionAmount: 50000,
        lateThresholdMinutes: 5,
      };

      const shift = record.shiftAssignment.shift;
      const isHoliday = holidayDates.has(dateStr);
      const isWeekend = dayOfWeek === 'Thứ bảy' || dayOfWeek === 'Chủ nhật';

      const otRequest = overtimes.find(o => o.userId === record.userId && moment(o.workDate).format('YYYY-MM-DD') === dateStr);

      let checkIn = record.checkInAt ? moment(record.checkInAt) : null;
      let checkOut = record.checkOutAt ? moment(record.checkOutAt) : null;
      
      // Compute Total Hours worked
      let totalMinutes = 0;
      if (checkIn && checkOut) {
        totalMinutes = checkOut.diff(checkIn, 'minutes');
        if (shift.breakMinutes) totalMinutes -= shift.breakMinutes;
      }
      if (totalMinutes < 0) totalMinutes = 0;
      
      const formatHrs = (mins: number) => {
        if (!mins) return '0:00:00';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}:${m.toString().padStart(2, '0')}:00`;
      };

      // 3. Calculation logic
      let lateMins = 0;
      let earlyMins = 0;
      let otMins = 0;
      let nightAllowance = 0;
      let lateDeduction = 0;

      const shiftStart = moment(`${dateStr} ${shift.startTime}`, 'YYYY-MM-DD HH:mm');
      const shiftEnd = moment(`${dateStr} ${shift.endTime}`, 'YYYY-MM-DD HH:mm');

      // Late
      if (checkIn && checkIn.isAfter(shiftStart.clone().add(Number(config.lateThresholdMinutes), 'minutes'))) {
        lateMins = checkIn.diff(shiftStart, 'minutes');
        lateDeduction = Number(config.lateDeductionAmount);
      }
      // Early leave (if no overtime)
      if (checkOut && checkOut.isBefore(shiftEnd) && !otRequest) {
        earlyMins = shiftEnd.diff(checkOut, 'minutes');
      }

      // Overtime
      if (checkOut && checkOut.isAfter(shiftEnd) && otRequest) {
        // Compare with approved OT end time
        const approvedEnd = moment(otRequest.endAt);
        const effectiveOtEnd = checkOut.isAfter(approvedEnd) ? approvedEnd : checkOut;
        otMins = effectiveOtEnd.diff(shiftEnd, 'minutes');
      }

      // Night allowance
      if (checkOut && checkOut.hour() >= Number(config.nightStartHour)) {
        nightAllowance = Number(config.nightAllowanceAmount);
      }

      // Multipliers
      let ot150 = 0, ot200 = 0;
      if (otMins > 0) {
        if (isHoliday || isWeekend) ot200 = otMins;
        else ot150 = otMins;
      }

      const row = {
        employeeCode: record.user.profile?.code || '',
        employeeName: record.user.profile?.fullName || record.user.username,
        department: record.department.name,
        position: '',
        date: moment(record.workDate).format('DD/MM/YYYY'),
        dayOfWeek,
        checkIn: checkIn ? checkIn.format('HH:mm') : '',
        checkOut: checkOut ? checkOut.format('HH:mm') : '',
        attendance: (lateMins > 0 || earlyMins > 0) ? (totalMinutes >= 240 ? 0.5 : 0) : 1, // rough estimate
        totalHours: formatHrs(totalMinutes),
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
        _rawOt150: ot150,
        _rawOt200: ot200,
        _rawLate: lateMins,
        _rawEarly: earlyMins,
      };

      if (!userGroups.has(record.userId)) userGroups.set(record.userId, []);
      userGroups.get(record.userId)!.push(row);
    }

    return {
      startDate: start,
      endDate: end,
      userGroups: Array.from(userGroups.values()),
    };
  }
}
