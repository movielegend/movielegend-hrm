import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';

export interface PayslipItemBreakdown {
  name: string;
  amount: number;
}

export interface PayslipItemDetail {
  id?: string;
  itemCode: string;
  itemName: string;
  itemType: string;
  amount: number;
  quantity?: number | null;
  rate?: number | null;
  note?: string | null;
}

export interface MonthlyPayslipData {
  id?: string;
  month: number;
  year: number;
  hasData: boolean;
  finalOfficialImageUrl?: string | null;
  periodCode?: string;
  status: string;
  calculatedAt?: string;
  employeeAcknowledgedAt?: string | null;
  employee: {
    fullName: string;
    userCode: string;
    departmentName: string;
    positionName: string;
  };
  baseSalary: number;
  actualSalary: number;
  standardWorkingDays: number;
  actualWorkingDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  allowanceAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  insuranceAmount: number;
  taxAmount: number;
  advanceAmount?: number;
  latePenaltyAmount?: number;
  grossSalary: number;
  netSalary: number;
  allowanceItems?: PayslipItemBreakdown[];
  bonusItems?: PayslipItemBreakdown[];
  deductionItems?: PayslipItemBreakdown[];
  items?: PayslipItemDetail[];
}

export interface ImportPayrollItemDetail {
  itemCode: string;
  itemName: string;
  itemType: string;
  amount: number;
  note?: string;
}

export interface ImportPayrollItem {
  userCode: string;
  fullName?: string;
  departmentName?: string;
  baseSalary: number;
  standardWorkingDays?: number;
  actualWorkingDays?: number;
  actualSalary?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  allowanceAmount?: number;
  bonusAmount?: number;
  deductionAmount?: number;
  insuranceAmount?: number;
  taxAmount?: number;
  advanceAmount?: number;
  latePenaltyAmount?: number;
  netSalary: number;
  note?: string;
  itemDetails?: ImportPayrollItemDetail[];
}

export interface ImportPayrollPayload {
  month: number;
  year: number;
  companyId?: string;
  items: ImportPayrollItem[];
}

export async function getMyPayslip(params?: { month?: number; year?: number }): Promise<MonthlyPayslipData> {
  const response = await apiClient.get<ApiResponse<MonthlyPayslipData>>('/payrolls/my-payslip', {
    params,
  });
  return unwrapData(response);
}

export async function getMyPayrolls(): Promise<any[]> {
  const response = await apiClient.get<ApiResponse<any[]>>('/payrolls/my');
  return unwrapData(response);
}

export async function importPayrolls(payload: ImportPayrollPayload): Promise<{ success: boolean; message: string; importedCount: number; periodId: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; importedCount: number; periodId: string }>>('/payrolls/import', payload);
  return unwrapData(response);
}

export async function acknowledgePayslip(id: string): Promise<{ success: boolean; message: string; employeeAcknowledgedAt: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; employeeAcknowledgedAt: string }>>(`/payrolls/my/${id}/acknowledge`);
  return unwrapData(response);
}

export interface UploadPayslipImagePayload {
  userId?: string;
  month: number;
  year: number;
  imageUrl: string;
  note?: string;
}

export async function uploadPayslipOfficialImage(payload: UploadPayslipImagePayload): Promise<{ success: boolean; message: string; imageUrl: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; imageUrl: string }>>('/payrolls/upload-image', payload);
  return unwrapData(response);
}
