import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ImportTimesheetItem } from '../api/attendance.api';

export interface ParseTimesheetExcelResult {
  items: ImportTimesheetItem[];
  errors: string[];
  totalRows: number;
}

export function parseTimesheetExcelData(base64Data: string): ParseTimesheetExcelResult {
  const workbook = XLSX.read(base64Data, { type: 'base64' });
  const sheetNames = workbook.SheetNames || [];
  const firstSheetName = sheetNames[0];
  if (!firstSheetName) {
    return { items: [], errors: ['File Excel không có sheet dữ liệu'], totalRows: 0 };
  }
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return { items: [], errors: ['Không thể đọc nội dung sheet dữ liệu'], totalRows: 0 };
  }
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawRows.length < 2) {
    return { items: [], errors: ['File Excel không có dữ liệu'], totalRows: 0 };
  }

  // Tìm hàng tiêu đề (header row)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('mã nv') || rowStr.includes('mã') || rowStr.includes('usercode') || rowStr.includes('họ và tên') || rowStr.includes('công')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers: string[] = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim().toLowerCase());
  
  // Ánh xạ cột
  const colMap = {
    userCode: headers.findIndex((h) => h.includes('mã nv') || h.includes('mã nhân viên') || h.includes('usercode') || h === 'mã'),
    fullName: headers.findIndex((h) => h.includes('họ tên') || h.includes('họ và tên') || h.includes('tên nv') || h.includes('fullname')),
    standardWorkingDays: headers.findIndex((h) => h.includes('chuẩn') || h.includes('công chuẩn')),
    actualWorkingDays: headers.findIndex((h) => h.includes('thực tế') || h.includes('công thực') || h.includes('ngày công')),
    paidLeaveDays: headers.findIndex((h) => h.includes('phép có lương') || h.includes('nghỉ phép') || h.includes('phép hưởng lương')),
    unpaidLeaveDays: headers.findIndex((h) => h.includes('không lương') || h.includes('nghỉ không phép')),
    otHours: headers.findIndex((h) => h.includes('tăng ca') || h.includes('giờ ot') || h.includes('ot') || h.includes('làm thêm')),
    lateMinutes: headers.findIndex((h) => h.includes('đi muộn') || h.includes('muộn') || h.includes('trễ')),
    earlyMinutes: headers.findIndex((h) => h.includes('về sớm') || h.includes('sớm')),
    note: headers.findIndex((h) => h.includes('ghi chú') || h.includes('note')),
  };

  const items: ImportTimesheetItem[] = [];
  const errors: string[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const userCode = String(row[colMap.userCode !== -1 ? colMap.userCode : 0] || '').trim();
    if (!userCode || userCode.toLowerCase() === 'tổng cộng' || userCode.toLowerCase() === 'stt') continue;

    const fullName = colMap.fullName !== -1 && row[colMap.fullName] ? String(row[colMap.fullName]).trim() : undefined;
    const standardWorkingDays = colMap.standardWorkingDays !== -1 && row[colMap.standardWorkingDays] !== undefined ? Number(row[colMap.standardWorkingDays]) : 26;
    const actualWorkingDays = colMap.actualWorkingDays !== -1 && row[colMap.actualWorkingDays] !== undefined ? Number(row[colMap.actualWorkingDays]) : 0;
    const paidLeaveDays = colMap.paidLeaveDays !== -1 && row[colMap.paidLeaveDays] !== undefined ? Number(row[colMap.paidLeaveDays]) : 0;
    const unpaidLeaveDays = colMap.unpaidLeaveDays !== -1 && row[colMap.unpaidLeaveDays] !== undefined ? Number(row[colMap.unpaidLeaveDays]) : 0;
    const otHours = colMap.otHours !== -1 && row[colMap.otHours] !== undefined ? Number(row[colMap.otHours]) : 0;
    const lateMinutes = colMap.lateMinutes !== -1 && row[colMap.lateMinutes] !== undefined ? Number(row[colMap.lateMinutes]) : 0;
    const earlyMinutes = colMap.earlyMinutes !== -1 && row[colMap.earlyMinutes] !== undefined ? Number(row[colMap.earlyMinutes]) : 0;
    const note = colMap.note !== -1 && row[colMap.note] ? String(row[colMap.note]).trim() : undefined;

    items.push({
      userCode,
      fullName,
      standardWorkingDays: isNaN(standardWorkingDays) ? 26 : standardWorkingDays,
      actualWorkingDays: isNaN(actualWorkingDays) ? 0 : actualWorkingDays,
      paidLeaveDays: isNaN(paidLeaveDays) ? 0 : paidLeaveDays,
      unpaidLeaveDays: isNaN(unpaidLeaveDays) ? 0 : unpaidLeaveDays,
      otHours: isNaN(otHours) ? 0 : otHours,
      lateMinutes: isNaN(lateMinutes) ? 0 : lateMinutes,
      earlyMinutes: isNaN(earlyMinutes) ? 0 : earlyMinutes,
      note,
    });
  }

  return {
    items,
    errors,
    totalRows: items.length,
  };
}

export async function exportTimesheetTemplate(month: number, year: number): Promise<void> {
  const sampleData = [
    {
      'Mã NV': 'NV001',
      'Họ và tên': 'Nguyễn Văn A',
      'Phòng ban': 'Phòng Kỹ thuật',
      'Số công chuẩn': 26,
      'Số công thực tế': 25,
      'Nghỉ phép hưởng lương': 1,
      'Nghỉ không lương': 0,
      'Giờ tăng ca (OT)': 12.5,
      'Số phút đi muộn': 0,
      'Số phút về sớm': 0,
      'Ghi chú': 'Hoàn thành tốt',
    },
    {
      'Mã NV': 'NV002',
      'Họ và tên': 'Trần Thị B',
      'Phòng ban': 'Phòng Kinh doanh',
      'Số công chuẩn': 26,
      'Số công thực tế': 26,
      'Nghỉ phép hưởng lương': 0,
      'Nghỉ không lương': 0,
      'Giờ tăng ca (OT)': 8.0,
      'Số phút đi muộn': 15,
      'Số phút về sớm': 0,
      'Ghi chú': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Bang_Cong_${month}_${year}`);

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}Mau_Bang_Cong_Thang_${month}_${year}.xlsx`;

  await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Mẫu Bảng Chấm Công Tháng ${month}/${year}`,
      UTI: 'com.microsoft.excel.xlsx',
    });
  }
}
