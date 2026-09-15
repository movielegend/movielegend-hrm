import { api } from './axios-client';

export interface CompetitionStatsResponse {
  configs: any[];
  liveBattle: {
    hanoiBranch: {
      name: string;
      gmv: number;
      targetGmv: number;
      totalOrders: number;
    };
    hcmBranch: {
      name: string;
      gmv: number;
      targetGmv: number;
      totalOrders: number;
    };
  };
}

export const getCompetitionStats = async (): Promise<CompetitionStatsResponse> => {
  const res = await api.get('/competition/stats');
  return res.data;
};

export const getCompetitionReviews = async (period = '2026-09') => {
  const res = await api.get(`/competition/reviews?period=${period}`);
  return res.data;
};

export const submitLeaderReviewApi = async (data: { userId: string; departmentId: string; period: string; note: string }) => {
  const res = await api.post('/competition/leader-review', data);
  return res.data;
};

export const submitAdminApprovalApi = async (reviewId: string, data: { toLevelNumber: number; note: string }) => {
  const res = await api.post(`/competition/admin-approve/${reviewId}`, data);
  return res.data;
};
