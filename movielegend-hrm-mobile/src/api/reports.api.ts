import { client } from './client';
import { assertApiUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';

export const reportsApi = {
  getAttendanceDetail: async (params: { startDate: string; endDate: string; departmentId?: string; userId?: string }) => {
    const res = await client.get('/reports/attendance/detail', { params });
    return res.data;
  },

  getAttendanceDetailExcelUrl: async (params: { startDate: string; endDate: string; departmentId?: string; userId?: string }) => {
    const token = await getAccessToken();
    const query = new URLSearchParams(params as any).toString();
    return `${assertApiUrl()}/exports/attendance-detail/excel?${query}&token=${token}`;
  }
};
