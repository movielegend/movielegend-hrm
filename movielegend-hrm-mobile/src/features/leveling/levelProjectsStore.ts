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
  status: ProjectAcceptanceStatus;
  leaderReportNote?: string;
  leaderReportUrl?: string;
  subTasks: BulletSubTask[];
}

const STORAGE_KEY = 'ML_LEVEL_DEPARTMENT_PROJECTS_V6';

// Clean Level projects initial template
const INITIAL_PROJECTS: LevelDepartmentProject[] = Array.from({ length: 5 }, (_, i) => ({
  id: `proj-lvl-${i + 1}`,
  levelNumber: i + 1,
  levelName: `Level ${i + 1}`,
  targetTierTitle: `Level ${i + 1} lên Level ${i + 2}`,
  departmentName: '',
  projectName: `Dự Án Level ${i + 1}`,
  adminNote: '',
  rewardItem: '',
  status: 'IN_PROGRESS',
  subTasks: [],
}));

// Singleton Store with In-Memory State & PubSub
class LevelProjectsStore {
  private projects: LevelDepartmentProject[] = INITIAL_PROJECTS;
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
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      }
    } catch {
      this.projects = INITIAL_PROJECTS;
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
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        this.projects = remoteData.map((rp: any) => ({
          id: rp.id || `proj-lvl-${rp.levelNumber}`,
          levelNumber: Number(rp.levelNumber),
          levelName: rp.levelName || `Level ${rp.levelNumber}`,
          targetTierTitle: rp.targetTierTitle || `Level ${rp.levelNumber} lên Level ${Number(rp.levelNumber) + 1}`,
          departmentName: rp.departmentName || this.currentDepartmentName || 'Phòng ban',
          projectName: rp.projectName || `Dự Án Level ${rp.levelNumber}`,
          adminNote: rp.adminNote || '',
          rewardItem: rp.rewardItem || '',
          status: rp.status || 'IN_PROGRESS',
          subTasks: (rp.subTasks || []).map((st: any, idx: number) => ({
            id: st.id || `st-${rp.levelNumber}-${idx + 1}`,
            orderNumber: st.orderNumber || idx + 1,
            title: st.title || `Công việc con ${idx + 1}`,
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

  public submitProjectToAdmin(levelNumber: number, leaderReportNote: string, leaderReportUrl?: string) {
    this.projects = this.projects.map((p) => {
      if (p.levelNumber !== levelNumber) return p;
      return {
        ...p,
        status: 'SUBMITTED_TO_ADMIN',
        leaderReportNote,
        leaderReportUrl,
      };
    });
    void this.save();
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
    getProjectByLevel: (lvl: number) => levelProjectsStore.getProjectByLevel(lvl),
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
      levelProjectsStore.submitProjectToAdmin(lvl, note, url),
    getAssignedSubTasksForUser: (userId?: string, userName?: string) =>
      levelProjectsStore.getAssignedSubTasksForUser(userId, userName),
    fetchProjects: () => levelProjectsStore.fetchFromApi(departmentId, departmentName),
    setProjects: (newProjects: LevelDepartmentProject[]) => levelProjectsStore.setProjects(newProjects),
  };
}
