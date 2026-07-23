import { Injectable } from '@nestjs/common';
import { badRequest } from '../../common/utils/error.util';

export interface ExportResult {
  filename: string;
  mimeType: string;
  encoding: 'utf8' | 'base64';
  content: string;
}

@Injectable()
export class ExportService {
  readonly maxRows = 5000;

  exportCsv(filename: string, rows: Array<Record<string, unknown>>): ExportResult {
    this.assertLimit(rows.length);
    const headers = this.headers(rows);
    const lines = [headers.join(',')].concat(
      rows.map((row) => headers.map((header) => this.csvCell(row[header])).join(',')),
    );
    return {
      filename: this.safeFilename(filename, 'csv'),
      mimeType: 'text/csv; charset=utf-8',
      encoding: 'utf8',
      content: `\uFEFF${lines.join('\n')}`,
    };
  }

  exportExcel(filename: string, rows: Array<Record<string, unknown>>): ExportResult {
    this.assertLimit(rows.length);
    const headers = this.headers(rows);
    
    const data: any[][] = [headers];
    for (const row of rows) {
      data.push(headers.map(h => row[h]));
    }
    
    const xlsx = require('xlsx');
    const ws = xlsx.utils.aoa_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Report');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return {
      filename: this.safeFilename(filename, 'xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      encoding: 'base64',
      content: buffer.toString('base64'),
    };
  }

  exportAttendanceDetailExcel(filename: string, reportData: any): ExportResult {
    const { startDate, endDate, userGroups } = reportData;
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const headers = [
      'Mã NV', 'Tên nhân viên', 'Phòng ban', 'Chức vụ', 'Ngày', 'Thứ', 'Vào', 'Ra', 'Công',
      'Tổng Giờ', 'Tăng ca x150%', 'Tăng ca x200%', 'Đi muộn ca chiều', 'Đi muộn ca sáng',
      'Tổng đi muộn', 'Về sớm', 'Tổng đi muộn + về sớm', 'Trừ đi muộn/quên chấm công', 'Hỗ trợ làm đêm'
    ];

    const data: any[][] = [];
    data.push([`Từ ngày ${startStr} đến ngày ${endStr}`]);
    data.push(headers);

    for (const group of userGroups) {
      if (group.length === 0) continue;
      const first = group[0];
      
      // Calculate summary
      let sumCong = 0, sumTru = 0, sumDem = 0;
      let sumOt150 = 0, sumOt200 = 0, sumMuon = 0, sumSom = 0;
      for (const row of group) {
        sumCong += row.attendance;
        sumOt150 += row._rawOt150;
        sumOt200 += row._rawOt200;
        sumMuon += row._rawLate;
        sumSom += row._rawEarly;
        sumTru += row.lateDeduction;
        sumDem += row.nightAllowance;
      }
      
      const formatHrs = (mins: number) => {
        if (!mins) return '0:00:00';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}:${m.toString().padStart(2, '0')}:00`;
      };

      data.push([
        first.employeeCode, first.employeeName, first.department, '', '', '', '', '',
        sumCong, '', formatHrs(sumOt150), formatHrs(sumOt200), '', '',
        formatHrs(sumMuon), formatHrs(sumSom), formatHrs(sumMuon + sumSom), sumTru, sumDem
      ]);

      for (const row of group) {
        data.push([
          '', '', '', '', row.date, row.dayOfWeek, row.checkIn, row.checkOut,
          row.attendance, row.totalHours, row.overtime150, row.overtime200,
          row.lateAfternoon, row.lateMorning, row.totalLate, row.earlyLeave,
          row.totalLateAndEarly, row.lateDeduction, row.nightAllowance
        ]);
      }
    }

    const xlsx = require('xlsx');
    const ws = xlsx.utils.aoa_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Attendance');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return {
      filename: this.safeFilename(filename, 'xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      encoding: 'base64',
      content: buffer.toString('base64'),
    };
  }

  safeFilename(name: string, extension: string): string {
    const safe = name.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'report';
    return `${safe}.${extension}`;
  }

  private assertLimit(count: number) {
    if (count > this.maxRows) throw badRequest('EXPORT_LIMIT_EXCEEDED', `Export limit is ${this.maxRows} rows`);
  }

  private headers(rows: Array<Record<string, unknown>>) {
    return rows.length ? Object.keys(rows[0]) : ['empty'];
  }

  private csvCell(value: unknown) {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private excelCell(value: unknown) {
    if (typeof value === 'number') return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
    return `<Cell><Data ss:Type="String">${this.xml(value === null || value === undefined ? '' : String(value))}</Data></Cell>`;
  }

  private xml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
