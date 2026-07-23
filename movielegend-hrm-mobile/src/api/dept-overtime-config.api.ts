import { client } from './client';

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
    const res = await client.get<DeptOvertimeConfig[]>('/department-overtime-configs');
    return res.data;
  },
  
  findByDepartment: async (departmentId: string) => {
    const res = await client.get<DeptOvertimeConfig>(`/department-overtime-configs/department/${departmentId}`);
    return res.data;
  },

  upsert: async (data: Partial<DeptOvertimeConfig>) => {
    const res = await client.post<DeptOvertimeConfig>('/department-overtime-configs', data);
    return res.data;
  },
};
