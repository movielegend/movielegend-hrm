import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ImportPayrollItem } from '../api/payroll.api';

export interface ParsePayslipExcelResult {
  items: ImportPayrollItem[];
  errors: string[];
  totalRows: number;
}

export function parsePayslipExcelData(base64Data: string): ParsePayslipExcelResult {
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
    if (rowStr.includes('mã nv') || rowStr.includes('mã') || rowStr.includes('lương') || rowStr.includes('thực lĩnh')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers: string[] = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim().toLowerCase());

  const colMap = {
    userCode: headers.findIndex((h) => h.includes('mã nv') || h.includes('mã nhân viên') || h.includes('usercode') || h === 'mã'),
    fullName: headers.findIndex((h) => h.includes('họ tên') || h.includes('họ và tên') || h.includes('tên nv')),
    departmentName: headers.findIndex((h) => h.includes('phòng ban') || h.includes('bộ phận') || h.includes('phòng')),
    baseSalary: headers.findIndex((h) => h.includes('lương cơ bản') || h.includes('lương cb') || h.includes('mức lương')),
    standardWorkingDays: headers.findIndex((h) => h.includes('công chuẩn') || h.includes('chuẩn')),
    actualWorkingDays: headers.findIndex((h) => h.includes('công thực') || h.includes('ngày công')),
    actualSalary: headers.findIndex((h) => h.includes('lương thực tế') || h.includes('lương theo công')),
    overtimeHours: headers.findIndex((h) => h.includes('giờ ot') || h.includes('giờ tăng ca') || h.includes('giờ làm thêm')),
    overtimeAmount: headers.findIndex((h) => h.includes('tiền tăng ca') || h.includes('tiền ot') || h.includes('lương tăng ca') || (h.includes('tăng ca') && !h.includes('giờ'))),
    allowanceAmount: headers.findIndex((h) => h.includes('phụ cấp') || h.includes('trợ cấp')),
    bonusAmount: headers.findIndex((h) => h.includes('thưởng') || h.includes('kpi') || h.includes('hoa hồng')),
    deductionAmount: headers.findIndex((h) => h.includes('giảm trừ') || h.includes('khấu trừ khác')),
    insuranceAmount: headers.findIndex((h) => h.includes('bảo hiểm') || h.includes('bhxh') || h.includes('bhyt')),
    taxAmount: headers.findIndex((h) => h.includes('thuế') || h.includes('tncn')),
    advanceAmount: headers.findIndex((h) => h.includes('tạm ứng') || h.includes('ứng lương')),
    latePenaltyAmount: headers.findIndex((h) => h.includes('phạt') || h.includes('đi muộn')),
    netSalary: headers.findIndex((h) => h.includes('thực lĩnh') || h.includes('thực nhận') || h.includes('net salary') || h.includes('lương net')),
    note: headers.findIndex((h) => h.includes('ghi chú') || h.includes('note')),
  };

  const items: ImportPayrollItem[] = [];
  const errors: string[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const userCode = String(row[colMap.userCode !== -1 ? colMap.userCode : 0] || '').trim();
    if (!userCode || userCode.toLowerCase() === 'tổng cộng' || userCode.toLowerCase() === 'stt') continue;

    const fullName = colMap.fullName !== -1 && row[colMap.fullName] ? String(row[colMap.fullName]).trim() : undefined;
    const departmentName = colMap.departmentName !== -1 && row[colMap.departmentName] ? String(row[colMap.departmentName]).trim() : undefined;

    const baseSalary = colMap.baseSalary !== -1 && row[colMap.baseSalary] !== undefined ? Number(row[colMap.baseSalary]) : 0;
    const standardWorkingDays = colMap.standardWorkingDays !== -1 && row[colMap.standardWorkingDays] !== undefined ? Number(row[colMap.standardWorkingDays]) : 26;
    const actualWorkingDays = colMap.actualWorkingDays !== -1 && row[colMap.actualWorkingDays] !== undefined ? Number(row[colMap.actualWorkingDays]) : 26;
    const actualSalary = colMap.actualSalary !== -1 && row[colMap.actualSalary] !== undefined ? Number(row[colMap.actualSalary]) : (baseSalary / (standardWorkingDays || 26)) * (actualWorkingDays || 26);

    const overtimeHours = colMap.overtimeHours !== -1 && row[colMap.overtimeHours] !== undefined ? Number(row[colMap.overtimeHours]) : 0;
    const overtimeAmount = colMap.overtimeAmount !== -1 && row[colMap.overtimeAmount] !== undefined ? Number(row[colMap.overtimeAmount]) : 0;
    const allowanceAmount = colMap.allowanceAmount !== -1 && row[colMap.allowanceAmount] !== undefined ? Number(row[colMap.allowanceAmount]) : 0;
    const bonusAmount = colMap.bonusAmount !== -1 && row[colMap.bonusAmount] !== undefined ? Number(row[colMap.bonusAmount]) : 0;
    const deductionAmount = colMap.deductionAmount !== -1 && row[colMap.deductionAmount] !== undefined ? Number(row[colMap.deductionAmount]) : 0;
    const insuranceAmount = colMap.insuranceAmount !== -1 && row[colMap.insuranceAmount] !== undefined ? Number(row[colMap.insuranceAmount]) : 0;
    const taxAmount = colMap.taxAmount !== -1 && row[colMap.taxAmount] !== undefined ? Number(row[colMap.taxAmount]) : 0;
    const advanceAmount = colMap.advanceAmount !== -1 && row[colMap.advanceAmount] !== undefined ? Number(row[colMap.advanceAmount]) : 0;
    const latePenaltyAmount = colMap.latePenaltyAmount !== -1 && row[colMap.latePenaltyAmount] !== undefined ? Number(row[colMap.latePenaltyAmount]) : 0;

    let netSalary = colMap.netSalary !== -1 && row[colMap.netSalary] !== undefined ? Number(row[colMap.netSalary]) : 0;
    if (isNaN(netSalary) || netSalary <= 0) {
      // Tự động tính nếu cột thực lĩnh bị trống
      netSalary = actualSalary + overtimeAmount + allowanceAmount + bonusAmount - (deductionAmount + insuranceAmount + taxAmount + advanceAmount + latePenaltyAmount);
    }

    const note = colMap.note !== -1 && row[colMap.note] ? String(row[colMap.note]).trim() : undefined;

    items.push({
      userCode,
      fullName,
      departmentName,
      baseSalary: isNaN(baseSalary) ? 0 : baseSalary,
      standardWorkingDays: isNaN(standardWorkingDays) ? 26 : standardWorkingDays,
      actualWorkingDays: isNaN(actualWorkingDays) ? 26 : actualWorkingDays,
      actualSalary: isNaN(actualSalary) ? 0 : Math.round(actualSalary),
      overtimeHours: isNaN(overtimeHours) ? 0 : overtimeHours,
      overtimeAmount: isNaN(overtimeAmount) ? 0 : overtimeAmount,
      allowanceAmount: isNaN(allowanceAmount) ? 0 : allowanceAmount,
      bonusAmount: isNaN(bonusAmount) ? 0 : bonusAmount,
      deductionAmount: isNaN(deductionAmount) ? 0 : deductionAmount,
      insuranceAmount: isNaN(insuranceAmount) ? 0 : insuranceAmount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      advanceAmount: isNaN(advanceAmount) ? 0 : advanceAmount,
      latePenaltyAmount: isNaN(latePenaltyAmount) ? 0 : latePenaltyAmount,
      netSalary: isNaN(netSalary) ? 0 : Math.round(netSalary),
      note,
    });
  }

  return {
    items,
    errors,
    totalRows: items.length,
  };
}

export async function exportPayslipTemplate(month: number, year: number): Promise<void> {
  const sampleData = [
    {
      'Mã NV': 'NV001',
      'Họ và tên': 'Nguyễn Văn A',
      'Phòng ban': 'Phòng Kỹ thuật',
      'Lương cơ bản': 15000000,
      'Số công chuẩn': 26,
      'Số công thực tế': 26,
      'Lương thực tế theo công': 15000000,
      'Giờ tăng ca (OT)': 10,
      'Tiền tăng ca (OT)': 1081730,
      'Phụ cấp': 1200000,
      'Thưởng KPI/Doanh số': 2000000,
      'BHXH/BHYT/BHTN (10.5%)': 1575000,
      'Thuế TNCN': 350000,
      'Tạm ứng lương': 0,
      'Khấu trừ đi muộn': 0,
      'Thực lĩnh (Net)': 17356730,
      'Ghi chú': 'Chuyển khoản VCB',
    },
    {
      'Mã NV': 'NV002',
      'Họ và tên': 'Trần Thị B',
      'Phòng ban': 'Phòng Kế toán',
      'Lương cơ bản': 12000000,
      'Số công chuẩn': 26,
      'Số công thực tế': 25,
      'Lương thực tế theo công': 11538462,
      'Giờ tăng ca (OT)': 5,
      'Tiền tăng ca (OT)': 432692,
      'Phụ cấp': 1000000,
      'Thưởng KPI/Doanh số': 1500000,
      'BHXH/BHYT/BHTN (10.5%)': 1260000,
      'Thuế TNCN': 150000,
      'Tạm ứng lương': 0,
      'Khấu trừ đi muộn': 50000,
      'Thực lĩnh (Net)': 13011154,
      'Ghi chú': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Phieu_Luong_${month}_${year}`);

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}Mau_Phieu_Luong_Thang_${month}_${year}.xlsx`;

  await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Mẫu Phiếu Lương Tháng ${month}/${year}`,
      UTI: 'com.microsoft.excel.xlsx',
    });
  }
}
