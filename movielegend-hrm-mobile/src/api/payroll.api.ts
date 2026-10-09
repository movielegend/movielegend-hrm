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

export interface AdvanceRequestItem {
  id: string;
  title: string;
  content: string;
  amount: number;
  status: string;
  stage: string;
  createdAt: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  disbursementProofUrl?: string | null;
  approvalSteps?: Array<{
    stage: string;
    action: string;
    actorName?: string;
    note?: string;
    at?: string;
  }>;
}

export interface AdvanceSummary {
  baseSalary: number;
  maxAdvanceLimit: number;
  currentMonthAdvancedAmount: number;
  remainingAdvanceLimit: number;
  requests: AdvanceRequestItem[];
}

export interface MonthlyPayslipData {
  id?: string;
  month: number;
  year: number;
  hasData: boolean;
  finalOfficialImageUrl?: string | null;
  advanceSummary?: AdvanceSummary;
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

export interface CompanyPayslipEmployee {
  userId: string;
  userCode: string;
  fullName: string;
  departmentName: string;
  positionName: string;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  actualWorkingDays: number;
  standardWorkingDays: number;
  status: string;
  hasData: boolean;
  finalOfficialImageUrl?: string | null;
  employeeAcknowledgedAt?: string | null;
}

export interface CompanyPayslipsResponse {
  month: number;
  year: number;
  totalEmployees: number;
  items: CompanyPayslipEmployee[];
}

export async function getCompanyMonthlyPayslips(params?: {
  month?: number;
  year?: number;
  departmentId?: string;
  search?: string;
}): Promise<CompanyPayslipsResponse> {
  const response = await apiClient.get<ApiResponse<CompanyPayslipsResponse>>('/payrolls/company-payslips', {
    params,
  });
  return unwrapData(response);
}

export interface DepartmentBatchImage {
  id: string;
  imageUrl: string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  labeledById?: string | null;
  labeledAt?: string | null;
}

export interface DepartmentBatchEmployee {
  userId: string;
  userCode: string;
  fullName: string;
  avatarUrl?: string | null;
  positionName: string;
  hasPayslip: boolean;
  assignedImageId?: string | null;
  assignedImageUrl?: string | null;
}

export interface DepartmentPayslipBatchResponse {
  departmentId: string;
  departmentName: string;
  month: number;
  year: number;
  totalImages: number;
  unassignedImages: DepartmentBatchImage[];
  assignedImages: DepartmentBatchImage[];
  employees: DepartmentBatchEmployee[];
}

export async function uploadDepartmentPayslipBatch(payload: {
  departmentId: string;
  month: number;
  year: number;
  imageUrls: string[];
  note?: string;
}): Promise<{ success: boolean; message: string; totalImages: number; unassignedCount: number }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; totalImages: number; unassignedCount: number }>>(
    '/payrolls/department-batch/upload',
    payload
  );
  return unwrapData(response);
}

export async function getDepartmentPayslipBatch(params: {
  departmentId?: string;
  month?: number;
  year?: number;
}): Promise<DepartmentPayslipBatchResponse> {
  const response = await apiClient.get<ApiResponse<DepartmentPayslipBatchResponse>>('/payrolls/department-batch', {
    params,
  });
  return unwrapData(response);
}

export async function assignDepartmentPayslipImage(payload: {
  departmentId: string;
  month: number;
  year: number;
  imageId: string;
  targetUserId: string;
}): Promise<{ success: boolean; message: string; assignedUserId: string; assignedImageUrl: string }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; assignedUserId: string; assignedImageUrl: string }>>(
    '/payrolls/department-batch/assign',
    payload
  );
  return unwrapData(response);
}

export async function unassignDepartmentPayslipImage(payload: {
  departmentId: string;
  month: number;
  year: number;
  imageId: string;
}): Promise<{ success: boolean; message: string; unassignedImageId: string; previousUserId?: string | null }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean; message: string; unassignedImageId: string; previousUserId?: string | null }>>(
    '/payrolls/department-batch/unassign',
    payload
  );
  return unwrapData(response);
}

