import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { levelingApi } from '../../api/leveling.api';

export interface BulletSubTask {
  id: string;
  orderNumber: number;
  title: string;
  description: string;
  targetKpi: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'SUBMITTED' | 'LEADER_APPROVED';
  submissionNote?: string;
  evidenceUrl?: string;
  evidenceImages?: string[];
  submittedAt?: string;
  leaderApprovedAt?: string;
  leaderFeedback?: string;
}

export type ProjectAcceptanceStatus = 'PENDING_LEADER_ACCEPT' | 'IN_PROGRESS' | 'SUBMITTED_TO_ADMIN' | 'ADMIN_APPROVED';

export interface LevelDepartmentProject {
  id: string;
  levelNumber: number;
  levelName: string;
  targetTierTitle: string;
  departmentName: string;
  projectName: string;
  adminNote: string;
  rewardItem: string;
  rewardType?: 'CASH' | 'PHYSICAL_ITEM' | 'HYBRID' | 'MULTIPLE';
  cashAmount?: number;
  physicalItems?: string[];
  physicalItemName?: string;
  status: ProjectAcceptanceStatus;
  isConfigured?: boolean;
  leaderReportNote?: string;
  leaderReportUrl?: string;
  adminFeedback?: string;
  submittedToAdminAt?: string;
  adminApprovedAt?: string;
  subTasks: BulletSubTask[];
}

export interface LevelProjectPermissionRequest {
  id: string;
  userId: string;
  userName: string;
  userCode?: string;
  departmentId?: string;
  departmentName?: string;
  levelNumber: number;
  levelName: string;
  projectName: string;
  userCurrentLevel: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  leaderFeedback?: string;
}

export const isProjectConfigured = (project?: LevelDepartmentProject | null): boolean => {
  if (!project) return false;
  if (project.isConfigured !== undefined) return project.isConfigured;
  const hasTasks = Array.isArray(project.subTasks) && project.subTasks.length > 0;
  const hasReward = Boolean(project.rewardItem && project.rewardItem.trim().length > 0);
  const hasAdminNote = Boolean(project.adminNote && project.adminNote.trim().length > 0);
  return hasTasks || hasReward || hasAdminNote;
};

const STORAGE_KEY = 'ML_LEVEL_DEPARTMENT_PROJECTS_V6';
const REQUESTS_STORAGE_KEY = 'ML_PROJECT_ACCESS_REQUESTS_V2';

// Initial empty projects list
const INITIAL_PROJECTS: LevelDepartmentProject[] = [];

// Singleton Store with In-Memory State & PubSub
class LevelProjectsStore {
  private projects: LevelDepartmentProject[] = INITIAL_PROJECTS;
  private accessRequests: LevelProjectPermissionRequest[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;
  private currentDepartmentId?: string;
  private currentDepartmentName?: string;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      } else {
        this.projects = [];
      }
    } catch {
      this.projects = [];
    }

    try {
      const storedReqs = await SecureStore.getItemAsync(REQUESTS_STORAGE_KEY);
      if (storedReqs) {
        this.accessRequests = JSON.parse(storedReqs);
      }
    } catch {
      this.accessRequests = [];
    } finally {
      this.initialized = true;
      this.notify();
    }

    // Background fetch from real backend API
    void this.fetchFromApi();
  }

  public async fetchFromApi(departmentId?: string, departmentName?: string) {
    try {
      this.currentDepartmentId = departmentId || this.currentDepartmentId;
      this.currentDepartmentName = departmentName || this.currentDepartmentName;

      const remoteData = await levelingApi.getProjects(this.currentDepartmentId, this.currentDepartmentName);
      if (Array.isArray(remoteData)) {
        this.projects = remoteData.map((rp: any, idx: number) => ({
          id: rp.id || `proj-${idx + 1}`,
          levelNumber: Number(rp.levelNumber || idx + 1),
          levelName: rp.projectName || `Dự án ${idx + 1}`,
          targetTierTitle: rp.projectName || `Dự án ${idx + 1}`,
          departmentName: rp.departmentName || this.currentDepartmentName || 'Phòng ban',
          projectName: rp.projectName || `Dự án ${idx + 1}`,
          adminNote: rp.adminNote || '',
          rewardItem: rp.rewardItem || '',
          rewardType: rp.rewardType,
          cashAmount: rp.cashAmount ? Number(rp.cashAmount) : undefined,
          physicalItems: rp.physicalItems,
          physicalItemName: rp.physicalItemName,
          status: rp.status || 'IN_PROGRESS',
          leaderReportNote: rp.leaderReportNote,
          leaderReportUrl: rp.leaderReportUrl,
          adminFeedback: rp.adminFeedback,
          submittedToAdminAt: rp.submittedToAdminAt,
          adminApprovedAt: rp.adminApprovedAt,
          subTasks: (rp.subTasks || []).map((st: any, sIdx: number) => ({
            id: st.id || `st-${idx + 1}-${sIdx + 1}`,
            orderNumber: st.orderNumber || sIdx + 1,
            title: st.title || `Công việc con ${sIdx + 1}`,
            description: st.description || '',
            targetKpi: st.targetKpi || '',
            assignedToUserId: st.assignedUserId || st.assignedToUserId,
            assignedToUserName: st.assignedUserName || st.assignedToUserName,
            status: st.status === 'LEADER_APPROVED' ? 'LEADER_APPROVED' : st.status === 'SUBMITTED' ? 'SUBMITTED' : (st.assignedUserId || st.assignedToUserId) ? 'ASSIGNED' : 'UNASSIGNED',
            submissionNote: st.submissionNote,
            evidenceUrl: st.evidenceUrl,
            evidenceImages: st.evidenceImages,
            submittedAt: st.submittedAt,
            leaderApprovedAt: st.reviewedAt || st.leaderApprovedAt,
            leaderFeedback: st.leaderFeedback,
          })),
        }));
        await this.save();
      }
    } catch {
      // offline / fallback to cached data
    }
  }

  public setProjects(newProjects: LevelDepartmentProject[]) {
    if (Array.isArray(newProjects) && newProjects.length > 0) {
      this.projects = newProjects;
      void this.save();
    }
  }

  private async save() {
    try {
      const storageKey = this.currentDepartmentId
        ? `${STORAGE_KEY}_${this.currentDepartmentId}`
        : STORAGE_KEY;
      await SecureStore.setItemAsync(storageKey, JSON.stringify(this.projects));
    } catch {
      // fallback in-memory
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProjects(): LevelDepartmentProject[] {
    return this.projects;
  }

  public getProjectByLevel(levelNumber: number): LevelDepartmentProject | undefined {
    return this.projects.find((p) => p.levelNumber === levelNumber);
  }

  public acceptProject(levelNumber: number) {
    this.projects = this.projects.map((p) =>
      p.levelNumber === levelNumber ? { ...p, status: 'IN_PROGRESS' } : p
    );
    void this.save();
  }

  public assignSubTask(
    levelNumber: number,
    subTaskId: string,
    userId: string,
    userName: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        subTasks: p.subTasks.map((st) => {
          if (st.id !== subTaskId) return st;
          return {
            ...st,
            assignedToUserId: userId,
            assignedToUserName: userName,
            status: st.status === 'UNASSIGNED' ? 'ASSIGNED' : st.status,
          };
        }),
      };
    });
    void this.save();

    // Sync to backend API
    void levelingApi.assignSubTask(
      levelNumber,
      subTaskId,
      userId,
      userName,
      departmentId || this.currentDepartmentId,
      departmentName || this.currentDepartmentName,
    ).catch(() => {});
  }

  public submitSubTask(
    levelNumber: number,
    subTaskId: string,
    submissionNote: string,
    evidenceUrl?: string,
    evidenceImages?: string[],
    departmentId?: string,
    departmentName?: string,
  ) {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        subTasks: p.subTasks.map((st) => {
          if (st.id !== subTaskId) return st;
          return {
            ...st,
            status: 'SUBMITTED',
            submissionNote,
            evidenceUrl,
            evidenceImages: evidenceImages || st.evidenceImages,
            submittedAt: new Date().toISOString(),
          };
        }),
      };
    });
    void this.save();

    // Sync to backend API
    void levelingApi
      .submitSubTask(
        levelNumber,
        subTaskId,
        submissionNote,
        evidenceUrl,
        evidenceImages,
        departmentId || this.currentDepartmentId,
        departmentName || this.currentDepartmentName,
      )
      .catch(() => {});
  }

  public approveSubTask(
    levelNumber: number,
    subTaskId: string,
    leaderFeedback?: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        subTasks: p.subTasks.map((st) => {
          if (st.id !== subTaskId) return st;
          return {
            ...st,
            status: 'LEADER_APPROVED',
            leaderApprovedAt: new Date().toISOString(),
            leaderFeedback: leaderFeedback || st.leaderFeedback,
          };
        }),
      };
    });
    void this.save();

    // Sync to backend API
    void levelingApi
      .reviewSubTask(
        levelNumber,
        subTaskId,
        'LEADER_APPROVED',
        departmentId || this.currentDepartmentId,
        departmentName || this.currentDepartmentName,
      )
      .catch(() => {});
  }

  public rejectSubTask(levelNumber: number, subTaskId: string, leaderFeedback: string) {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        subTasks: p.subTasks.map((st) => {
          if (st.id !== subTaskId) return st;
          return {
            ...st,
            status: 'ASSIGNED',
            leaderFeedback,
          };
        }),
      };
    });
    void this.save();
  }

  public async submitProjectToAdmin(
    levelNumber: number,
    leaderReportNote: string,
    leaderReportUrl?: string,
    departmentId?: string,
    departmentName?: string,
  ): Promise<void> {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        status: 'SUBMITTED_TO_ADMIN',
        leaderReportNote,
        leaderReportUrl,
        submittedToAdminAt: new Date().toISOString(),
      };
    });
    await this.save();

    // Sync to backend API
    try {
      await levelingApi.submitProjectToAdmin(levelNumber, {
        leaderReportNote,
        leaderReportUrl,
        departmentId: departmentId || this.currentDepartmentId,
        departmentName: departmentName || this.currentDepartmentName,
      });
    } catch {
      // offline / fallback
    }
  }

  public async adminApproveProject(
    levelNumber: number,
    adminFeedback?: string,
    departmentId?: string,
    departmentName?: string,
  ): Promise<void> {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        status: 'ADMIN_APPROVED',
        adminFeedback,
        adminApprovedAt: new Date().toISOString(),
        subTasks: p.subTasks.map((st) => ({
          ...st,
          status: 'LEADER_APPROVED',
        })),
      };
    });
    await this.save();

    // Sync to backend API
    try {
      await levelingApi.adminReviewProject(levelNumber, {
        status: 'ADMIN_APPROVED',
        adminFeedback,
        departmentId: departmentId || this.currentDepartmentId,
        departmentName: departmentName || this.currentDepartmentName,
      });
    } catch {
      // offline / fallback
    }
  }

  public async adminRejectProject(
    levelNumber: number,
    adminFeedback: string,
    departmentId?: string,
    departmentName?: string,
  ): Promise<void> {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        status: 'IN_PROGRESS',
        adminFeedback,
      };
    });
    await this.save();

    // Sync to backend API
    try {
      await levelingApi.adminReviewProject(levelNumber, {
        status: 'IN_PROGRESS',
        adminFeedback,
        departmentId: departmentId || this.currentDepartmentId,
        departmentName: departmentName || this.currentDepartmentName,
      });
    } catch {
      // offline / fallback
    }
  }

  // Get all subtasks assigned to a specific employee or leader across all level projects
  public getAssignedSubTasksForUser(userId?: string, userName?: string): { project: LevelDepartmentProject; subTask: BulletSubTask }[] {
    const results: { project: LevelDepartmentProject; subTask: BulletSubTask }[] = [];
    const normalizedUserId = userId?.trim().toLowerCase();
    const normalizedUserName = userName?.trim().toLowerCase();

    this.projects.forEach((proj) => {
      proj.subTasks.forEach((st) => {
        const stUserId = st.assignedToUserId?.trim().toLowerCase();
        const stUserName = st.assignedToUserName?.trim().toLowerCase();

        const isIdMatched = Boolean(
          (normalizedUserId && stUserId && (stUserId === normalizedUserId || stUserId === 'leader-me')) ||
          (!normalizedUserId && stUserId === 'leader-me')
        );

        const isNameMatched = Boolean(
          normalizedUserName &&
          stUserName &&
          (stUserName.includes(normalizedUserName) ||
            normalizedUserName.includes(stUserName) ||
            stUserName.includes('trưởng nhóm') ||
            stUserName.includes('chính tôi'))
        );

        const isFallbackMatched = !normalizedUserId && !normalizedUserName && Boolean(st.assignedToUserId);

        if (isIdMatched || isNameMatched || isFallbackMatched) {
          results.push({ project: proj, subTask: st });
        }
      });
    });
    return results;
  }

  private async saveRequests() {
    try {
      await SecureStore.setItemAsync(REQUESTS_STORAGE_KEY, JSON.stringify(this.accessRequests));
    } catch {
      // fallback in-memory
    }
    this.notify();
  }

  public getAccessRequests(): LevelProjectPermissionRequest[] {
    return this.accessRequests;
  }

  public getAccessRequest(levelNumber: number, userId: string): LevelProjectPermissionRequest | undefined {
    const normId = userId.trim().toLowerCase();
    return this.accessRequests.find(
      (r) =>
        r.levelNumber === levelNumber &&
        (r.userId.toLowerCase() === normId || r.userName.toLowerCase() === normId)
    );
  }

  public hasProjectAccess(levelNumber: number, userId?: string, currentUserLevelNumber = 1): boolean {
    if (levelNumber <= currentUserLevelNumber) return true;
    if (!userId) return false;
    const req = this.getAccessRequest(levelNumber, userId);
    return req?.status === 'APPROVED';
  }

  public async requestProjectAccess(params: {
    userId: string;
    userName: string;
    userCode?: string;
    departmentId?: string;
    departmentName?: string;
    levelNumber: number;
    levelName?: string;
    projectName?: string;
    userCurrentLevel?: number;
    reason?: string;
  }): Promise<LevelProjectPermissionRequest> {
    const normUserId = params.userId.trim().toLowerCase();
    const existingIdx = this.accessRequests.findIndex(
      (r) =>
        r.levelNumber === params.levelNumber &&
        (r.userId.toLowerCase() === normUserId || r.userName.toLowerCase() === normUserId)
    );

    const existing = existingIdx >= 0 ? this.accessRequests[existingIdx] : undefined;
    const newReq: LevelProjectPermissionRequest = {
      id: existing?.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: params.userId,
      userName: params.userName,
      userCode: params.userCode,
      departmentId: params.departmentId || this.currentDepartmentId,
      departmentName: params.departmentName || this.currentDepartmentName,
      levelNumber: params.levelNumber,
      levelName: params.levelName || `Level ${params.levelNumber}`,
      projectName: params.projectName || `Dự Án Level ${params.levelNumber}`,
      userCurrentLevel: params.userCurrentLevel || 1,
      reason: params.reason || '',
      status: 'PENDING',
      requestedAt: new Date().toLocaleString('vi-VN'),
    };

    if (existingIdx >= 0) {
      this.accessRequests[existingIdx] = newReq;
    } else {
      this.accessRequests.unshift(newReq);
    }
    await this.saveRequests();
    return newReq;
  }

  public async reviewProjectAccess(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    leaderFeedback?: string,
    reviewedBy?: string
  ): Promise<void> {
    this.accessRequests = this.accessRequests.map((r) => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status,
        leaderFeedback,
        reviewedBy,
        reviewedAt: new Date().toLocaleString('vi-VN'),
      };
    });
    await this.saveRequests();
  }

  public getPendingAccessRequests(departmentId?: string, levelNumber?: number): LevelProjectPermissionRequest[] {
    return this.accessRequests.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (departmentId && r.departmentId && r.departmentId !== departmentId) return false;
      if (levelNumber && r.levelNumber !== levelNumber) return false;
      return true;
    });
  }
}

export const levelProjectsStore = new LevelProjectsStore();

export function useLevelProjects(departmentId?: string, departmentName?: string) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = levelProjectsStore.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    void levelProjectsStore.fetchFromApi(departmentId, departmentName);
    return unsubscribe;
  }, [departmentId, departmentName]);

  return {
    projects: levelProjectsStore.getProjects(),
    accessRequests: levelProjectsStore.getAccessRequests(),
    getProjectByLevel: (lvl: number) => levelProjectsStore.getProjectByLevel(lvl),
    getAccessRequest: (lvl: number, uId: string) => levelProjectsStore.getAccessRequest(lvl, uId),
    hasProjectAccess: (lvl: number, uId?: string, curLvl?: number) =>
      levelProjectsStore.hasProjectAccess(lvl, uId, curLvl),
    requestProjectAccess: (params: Parameters<typeof levelProjectsStore.requestProjectAccess>[0]) =>
      levelProjectsStore.requestProjectAccess(params),
    reviewProjectAccess: (reqId: string, status: 'APPROVED' | 'REJECTED', feedback?: string, reviewer?: string) =>
      levelProjectsStore.reviewProjectAccess(reqId, status, feedback, reviewer),
    getPendingAccessRequests: (deptId?: string, lvl?: number) =>
      levelProjectsStore.getPendingAccessRequests(deptId, lvl),
    acceptProject: (lvl: number) => levelProjectsStore.acceptProject(lvl),
    assignSubTask: (lvl: number, stId: string, uId: string, uName: string) =>
      levelProjectsStore.assignSubTask(lvl, stId, uId, uName, departmentId, departmentName),
    submitSubTask: (lvl: number, stId: string, note: string, url?: string, images?: string[]) =>
      levelProjectsStore.submitSubTask(lvl, stId, note, url, images, departmentId, departmentName),
    approveSubTask: (lvl: number, stId: string, feedback?: string) =>
      levelProjectsStore.approveSubTask(lvl, stId, feedback, departmentId, departmentName),
    rejectSubTask: (lvl: number, stId: string, feedback: string) =>
      levelProjectsStore.rejectSubTask(lvl, stId, feedback),
    submitProjectToAdmin: (lvl: number, note: string, url?: string) =>
      levelProjectsStore.submitProjectToAdmin(lvl, note, url, departmentId, departmentName),
    adminApproveProject: (lvl: number, feedback?: string) =>
      levelProjectsStore.adminApproveProject(lvl, feedback, departmentId, departmentName),
    adminRejectProject: (lvl: number, feedback: string) =>
      levelProjectsStore.adminRejectProject(lvl, feedback, departmentId, departmentName),
    getAssignedSubTasksForUser: (userId?: string, userName?: string) =>
      levelProjectsStore.getAssignedSubTasksForUser(userId, userName),
    fetchProjects: () => levelProjectsStore.fetchFromApi(departmentId, departmentName),
    setProjects: (newProjects: LevelDepartmentProject[]) => levelProjectsStore.setProjects(newProjects),
  };
}
