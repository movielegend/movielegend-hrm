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

export const levelingApi = {
  // 1. GMV APIs
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
    }
  ): Promise<LevelGmvConfig> => {
    const res = await apiClient.post(`/leveling/gmv/${levelNumber}`, data);
    return extractData<LevelGmvConfig>(res);
  },

  // 2. Level Projects & SubTasks APIs
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
      { assignedUserId, assignedUserName, departmentId, departmentName }
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
      { submissionNote, evidenceUrl, evidenceImages, departmentId, departmentName }
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
      { status, departmentId, departmentName }
    );
    return extractData(res);
  },

  // 3. Admin Department Configuration APIs
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
};
