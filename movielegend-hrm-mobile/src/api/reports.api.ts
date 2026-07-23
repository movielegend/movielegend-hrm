import { client } from './client';
import { assertApiUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';

export const reportsApi = {
  getAttendanceDetail: async (params: { startDate: string; endDate: string; departmentId?: string | string[]; userId?: string | string[] }) => {
    const formattedParams = { ...params };
    if (Array.isArray(formattedParams.departmentId)) formattedParams.departmentId = formattedParams.departmentId.join(',');
    if (Array.isArray(formattedParams.userId)) formattedParams.userId = formattedParams.userId.join(',');
    const res = await client.get('/reports/attendance/detail', { params: formattedParams });
    return res.data;
  },

  getAttendanceDetailExcelUrl: async (params: { startDate: string; endDate: string; departmentId?: string | string[]; userId?: string | string[] }) => {
    const token = await getAccessToken();
    const formattedParams = { ...params };
    if (Array.isArray(formattedParams.departmentId)) formattedParams.departmentId = formattedParams.departmentId.join(',');
    if (Array.isArray(formattedParams.userId)) formattedParams.userId = formattedParams.userId.join(',');
    const query = new URLSearchParams(formattedParams as any).toString();
    return `${assertApiUrl()}/exports/attendance-detail/excel?${query}&token=${token}`;
  }
};
