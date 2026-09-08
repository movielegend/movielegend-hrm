import { apiClient, unwrapData } from './client';
import { LevelGmvConfig } from '../features/leveling/levelGmvStore';
import { LevelDepartmentProject, BulletSubTask } from '../features/leveling/levelProjectsStore';

function extractData<T>(res: any): T {
  try {
    return unwrapData(res);
  } catch {
    if (res?.data?.data !== undefined) return res.data.data;
    if (res?.data !== undefined) return res.data;
    return res;
  }
}

export interface DepartmentLevelItem {
  levelNumber: number;
  levelName: string;
  defaultName: string;
  customLevelName: string;
  displayName: string;
  badgeTitle: string;
  colorHex: string;
  minTenureMonths: number;
  targetShiftsCount: number;
  rewardType?: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
  promotionBonusAmount?: number;
  physicalItemName?: string;
  allowanceAmount?: number;
  retentionMultiplier?: number;
  perks?: string[];
  motivationQuote?: string;
}

export interface UserLevelProgressData {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  departmentId?: string;
  departmentName?: string;
  currentLevel: {
    levelNumber: number;
    levelName: string;
    displayName: string;
    badgeTitle: string;
    colorHex: string;
  };
  nextLevel: {
    levelNumber: number;
    levelName: string;
    displayName: string;
    badgeTitle: string;
    colorHex: string;
  };
  overallProgressPercent: number;
  metrics: {
    tenure: {
      currentMonths: number;
      targetMonths: number;
      percent: number;
      startDate: string;
    };
    shifts: {
      currentCount: number;
      targetCount: number;
      percent: number;
    };
    discipline: {
      lateCount: number;
      score: number;
      percent: number;
    };
    gmv: {
      currentGmv: number;
      targetGmv: number;
      percent: number;
      unit: string;
    };
  };
  pendingRequest?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED';
    fromLevelNumber: number;
    toLevelNumber: number;
    submissionNote?: string;
    evidenceImages?: string[];
    leaderNote?: string;
    createdAt: string;
  } | null;
  nextLevelPerks?: {
    levelNumber: number;
    levelName: string;
    displayName: string;
    colorHex: string;
    promotionBonusAmount: number;
    physicalItemName?: string;
    physicalItems?: string[];
    retentionMultiplier: number;
    allowanceAmount?: number;
    perks: string[];
    motivationQuote?: string;
    projectName?: string;
  };
}

export interface NextLevelPerkAppendix {
  levelNumber: number;
  levelName: string;
  displayName: string;
  colorHex: string;
  promotionBonusAmount: number;
  physicalItemName?: string;
  physicalItems?: string[];
  retentionMultiplier: number;
  allowanceAmount?: number;
  perks: string[];
  motivationQuote?: string;
  projectName?: string;
}

export interface LevelPromotionRequestItem {
  id: string;
  userId: string;
  departmentId: string;
  fromLevelNumber: number;
  toLevelNumber: number;
  submissionNote?: string;
  evidenceImages?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED';
  leaderNote?: string;
  decidedByUserId?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    userCode: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
      currentLevelNumber?: number;
    };
  };
  department?: {
    id: string;
    name: string;
  };
}

export const levelingApi = {
  // =========================================================================
  // 1. Department Level Configs
  // =========================================================================
  getDepartmentLevelConfigs: async (departmentId: string): Promise<DepartmentLevelItem[]> => {
    const res = await apiClient.get(`/leveling/departments/${departmentId}/configs`);
    return extractData<DepartmentLevelItem[]>(res);
  },

  saveDepartmentLevelConfigs: async (
    departmentId: string,
    configs: Array<{
      levelNumber: number;
      customLevelName: string;
      badgeTitle?: string;
      rewardType?: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID';
      promotionBonusAmount?: number;
      physicalItemName?: string;
      allowanceAmount?: number;
      retentionMultiplier?: number;
      perks?: string[];
      motivationQuote?: string;
    }>,
  ): Promise<{ success: boolean; count: number }> => {
    const res = await apiClient.post(`/leveling/departments/${departmentId}/configs`, { configs });
    return extractData(res);
  },

  // =========================================================================
  // 2. User Level Progress (%)
  // =========================================================================
  getMyLevelProgress: async (): Promise<UserLevelProgressData> => {
    const res = await apiClient.get('/leveling/my-progress');
    return extractData<UserLevelProgressData>(res);
  },

  getUserLevelProgress: async (userId: string): Promise<UserLevelProgressData> => {
    const res = await apiClient.get(`/leveling/users/${userId}/progress`);
    return extractData<UserLevelProgressData>(res);
  },

  // =========================================================================
  // 3. Promotion Requests (Self-Submit & Leader Review)
  // =========================================================================
  submitPromotionRequest: async (data: {
    fromLevelNumber: number;
    toLevelNumber: number;
    submissionNote: string;
    evidenceImages?: string[];
    departmentId?: string;
  }): Promise<LevelPromotionRequestItem> => {
    const res = await apiClient.post('/leveling/promotion-requests', data);
    return extractData<LevelPromotionRequestItem>(res);
  },

  getDepartmentPromotionRequests: async (
    departmentId?: string,
    status?: string,
  ): Promise<LevelPromotionRequestItem[]> => {
    const params: Record<string, string> = {};
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    const res = await apiClient.get('/leveling/promotion-requests', { params });
    return extractData<LevelPromotionRequestItem[]>(res);
  },

  getPromotionRequestById: async (id: string): Promise<LevelPromotionRequestItem> => {
    const res = await apiClient.get(`/leveling/promotion-requests/${id}`);
    return extractData<LevelPromotionRequestItem>(res);
  },

  reviewPromotionRequest: async (
    id: string,
    data: {
      status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED';
      leaderNote?: string;
    },
  ): Promise<LevelPromotionRequestItem> => {
    const res = await apiClient.post(`/leveling/promotion-requests/${id}/review`, data);
    return extractData<LevelPromotionRequestItem>(res);
  },

  // =========================================================================
  // 4. Direct Level Setting
  // =========================================================================
  setDirectUserLevel: async (
    userId: string,
    levelNumber: number,
    note?: string,
  ): Promise<{ success: boolean; userId: string; newLevelNumber: number }> => {
    const res = await apiClient.post(`/leveling/users/${userId}/set-level`, { levelNumber, note });
    return extractData(res);
  },

  // =========================================================================
  // 5. Existing GMV APIs
  // =========================================================================
  getGmvConfigs: async (): Promise<LevelGmvConfig[]> => {
    const res = await apiClient.get('/leveling/gmv');
    return extractData<LevelGmvConfig[]>(res);
  },

  getGmvByLevel: async (levelNumber: number): Promise<LevelGmvConfig> => {
    const res = await apiClient.get(`/leveling/gmv/${levelNumber}`);
    return extractData<LevelGmvConfig>(res);
  },

  updateGmv: async (
    levelNumber: number,
    data: {
      currentGmv: number;
      promotionCeilingGmv: number;
      retentionFloorGmv: number;
    },
  ): Promise<LevelGmvConfig> => {
    const res = await apiClient.post(`/leveling/gmv/${levelNumber}`, data);
    return extractData<LevelGmvConfig>(res);
  },

  // =========================================================================
  // 6. Level Projects & SubTasks APIs
  // =========================================================================
  getProjects: async (departmentId?: string, departmentName?: string): Promise<LevelDepartmentProject[]> => {
    const params: Record<string, string> = {};
    if (departmentId) params.departmentId = departmentId;
    if (departmentName) params.departmentName = departmentName;
    const res = await apiClient.get('/leveling/projects', { params });
    const data = extractData<LevelDepartmentProject[]>(res);
    return Array.isArray(data) ? data : (res.data?.data || []);
  },

  getProjectByLevel: async (
    levelNumber: number,
    departmentId?: string,
    departmentName?: string,
  ): Promise<LevelDepartmentProject> => {
    const params: Record<string, string> = {};
    if (departmentId) params.departmentId = departmentId;
    if (departmentName) params.departmentName = departmentName;
    const res = await apiClient.get(`/leveling/projects/${levelNumber}`, { params });
    return extractData<LevelDepartmentProject>(res);
  },

  assignSubTask: async (
    levelNumber: number,
    subTaskId: string,
    assignedUserId: string,
    assignedUserName: string,
    departmentId?: string,
    departmentName?: string,
  ): Promise<{ success: boolean; subTask: BulletSubTask }> => {
    const res = await apiClient.post(
      `/leveling/projects/${levelNumber}/subtasks/${subTaskId}/assign`,
      { assignedUserId, assignedUserName, departmentId, departmentName },
    );
    return extractData(res);
  },

  submitSubTask: async (
    levelNumber: number,
    subTaskId: string,
    submissionNote: string,
    evidenceUrl?: string,
    evidenceImages?: string[],
    departmentId?: string,
    departmentName?: string,
  ): Promise<{ success: boolean; subTask: BulletSubTask }> => {
    const res = await apiClient.post(
      `/leveling/projects/${levelNumber}/subtasks/${subTaskId}/submit`,
      { submissionNote, evidenceUrl, evidenceImages, departmentId, departmentName },
    );
    return extractData(res);
  },

  reviewSubTask: async (
    levelNumber: number,
    subTaskId: string,
    status: 'LEADER_APPROVED' | 'PENDING',
    departmentId?: string,
    departmentName?: string,
  ): Promise<{ success: boolean; subTask: BulletSubTask; completedSubTasks: number }> => {
    const res = await apiClient.post(
      `/leveling/projects/${levelNumber}/subtasks/${subTaskId}/review`,
      { status, departmentId, departmentName },
    );
    return extractData(res);
  },

  // =========================================================================
  // 7. Admin Department Configuration APIs
  // =========================================================================
  getAdminDepartmentConfig: async (
    departmentId: string,
    year?: number,
    departmentName?: string,
  ): Promise<any | null> => {
    const params: Record<string, any> = { departmentId };
    if (year) params.year = year;
    if (departmentName) params.departmentName = departmentName;
    const res = await apiClient.get('/leveling/admin/config', { params });
    return extractData(res);
  },

  saveAdminDepartmentConfig: async (data: {
    departmentId: string;
    departmentName: string;
    year: number;
    levels: any[];
  }): Promise<{ success: boolean; count: number; departmentName: string }> => {
    const res = await apiClient.post('/leveling/admin/config', data);
    return extractData(res);
  },

  // =========================================================================
  // 8. User Level APIs
  // =========================================================================
  getUserLevel: async (userId: string): Promise<{ userId: string; levelNumber: number }> => {
    const res = await apiClient.get(`/leveling/user-level/${userId}`);
    return extractData(res);
  },

  updateUserLevel: async (
    userId: string,
    levelNumber: number,
  ): Promise<{ success: boolean; userId: string; levelNumber: number }> => {
    const res = await apiClient.post(`/leveling/user-level/${userId}`, { levelNumber });
    return extractData(res);
  },
};
