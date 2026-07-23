import { apiClient, unwrapData } from './client';

export interface DeptOvertimeConfig {
  id: string;
  departmentId: string;
  weekdayMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  nightAllowanceAmount: number;
  nightStartHour: number;
  lateDeductionAmount: number;
  lateThresholdMinutes: number;
  isActive: boolean;
  department?: any;
}

export const deptOvertimeConfigApi = {
  findAll: async () => {
    const res = await apiClient.get('/department-overtime-configs');
    return unwrapData(res) as DeptOvertimeConfig[];
  },
  
  findByDepartment: async (departmentId: string) => {
    const res = await apiClient.get(`/department-overtime-configs/department/${departmentId}`);
    return unwrapData(res) as DeptOvertimeConfig;
  },

  upsert: async (data: Partial<DeptOvertimeConfig>) => {
    const res = await apiClient.post('/department-overtime-configs', data);
    return unwrapData(res) as DeptOvertimeConfig;
  },
};
