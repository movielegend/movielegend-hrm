import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const CONFIG_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_configs.json');
const PROJECT_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_projects.json');

export interface LevelGmvItem {
  levelNumber: number;
  levelName: string;
  currentGmv: number;
  promotionCeilingGmv: number;
  retentionFloorGmv: number;
  gmvUnit: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BulletSubTaskItem {
  id: string;
  orderNumber: number;
  title: string;
  targetKpi?: string;
  description?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  status: 'PENDING' | 'SUBMITTED' | 'LEADER_APPROVED' | 'ADMIN_APPROVED';
  submissionNote?: string;
  evidenceUrl?: string;
  evidenceImages?: string[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LevelDepartmentProjectItem {
  levelNumber: number;
  levelName: string;
  departmentName: string;
  projectName: string;
  totalSubTasks: number;
  completedSubTasks: number;
  rewardItem?: string;
  subTasks: BulletSubTaskItem[];
}

@Injectable()
export class LevelingService {
  private gmvConfigs: LevelGmvItem[] = [
    { levelNumber: 1, levelName: 'Level 1', currentGmv: 0, promotionCeilingGmv: 50, retentionFloorGmv: 0, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 2, levelName: 'Level 2', currentGmv: 0, promotionCeilingGmv: 150, retentionFloorGmv: 30, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 3, levelName: 'Level 3', currentGmv: 0, promotionCeilingGmv: 400, retentionFloorGmv: 100, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 4, levelName: 'Level 4', currentGmv: 0, promotionCeilingGmv: 800, retentionFloorGmv: 400, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 5, levelName: 'Level 5', currentGmv: 0, promotionCeilingGmv: 1000, retentionFloorGmv: 500, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 6, levelName: 'Level 6', currentGmv: 0, promotionCeilingGmv: 1500, retentionFloorGmv: 800, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 7, levelName: 'Level 7', currentGmv: 0, promotionCeilingGmv: 3000, retentionFloorGmv: 1500, gmvUnit: 'Tr VNĐ' },
    { levelNumber: 8, levelName: 'Level 8', currentGmv: 0, promotionCeilingGmv: 5000, retentionFloorGmv: 3000, gmvUnit: 'Tr VNĐ' },
  ];

  private projects: LevelDepartmentProjectItem[] = [];

  private departmentConfigs = new Map<string, any>();
  private departmentProjects = new Map<string, LevelDepartmentProjectItem[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(CONFIG_STORAGE_FILE)) {
        const raw = fs.readFileSync(CONFIG_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => this.departmentConfigs.set(k, v));
      }
    } catch {
      // ignore
    }

    try {
      if (fs.existsSync(PROJECT_STORAGE_FILE)) {
        const raw = fs.readFileSync(PROJECT_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => this.departmentProjects.set(k, v as any));
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      const configObj = Object.fromEntries(this.departmentConfigs.entries());
      fs.writeFileSync(CONFIG_STORAGE_FILE, JSON.stringify(configObj, null, 2), 'utf8');

      const projectObj = Object.fromEntries(this.departmentProjects.entries());
      fs.writeFileSync(PROJECT_STORAGE_FILE, JSON.stringify(projectObj, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  public getGmvConfigs(): LevelGmvItem[] {
    return this.gmvConfigs;
  }

  public getGmvByLevel(levelNumber: number): LevelGmvItem {
    const found = this.gmvConfigs.find((c) => c.levelNumber === levelNumber);
    if (!found) throw new NotFoundException(`Level ${levelNumber} GMV config not found`);
    return found;
  }

  public updateGmv(
    levelNumber: number,
    currentGmv: number,
    promotionCeilingGmv: number,
    retentionFloorGmv: number,
    updatedBy?: string,
    departmentId?: string,
  ): LevelGmvItem {
    const index = this.gmvConfigs.findIndex((c) => c.levelNumber === levelNumber);
    const item: LevelGmvItem = {
      levelNumber,
      levelName: `Level ${levelNumber}`,
      currentGmv,
      promotionCeilingGmv,
      retentionFloorGmv,
      gmvUnit: 'Tr VNĐ',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    if (index >= 0) {
      this.gmvConfigs[index] = item;
    } else {
      this.gmvConfigs.push(item);
    }

    if (departmentId) {
      this.realtimeEvents.emitToDepartment(departmentId, 'level:gmv:updated', item);
    }
    this.realtimeEvents.emitToRoom('level:config_room', 'level:gmv:updated', item);

    return item;
  }

  public getAdminDepartmentConfig(departmentId: string, year?: number, departmentName?: string): any | null {
    const y = year || 2026;
    const key1 = `${departmentId}_${y}`;
    const key2 = `${departmentName || ''}_${y}`;
    return this.departmentConfigs.get(key1) || this.departmentConfigs.get(key2) || null;
  }

  public saveAdminDepartmentConfig(payload: {
    departmentId: string;
    departmentName: string;
    year: number;
    levels: any[];
  }) {
    const { departmentId, departmentName, year, levels } = payload;
    const configKey = `${departmentId}_${year}`;
    this.departmentConfigs.set(configKey, levels);
    if (departmentName) {
      this.departmentConfigs.set(`${departmentName}_${year}`, levels);
    }

    // Convert Admin levels to LevelDepartmentProjectItem[]
    const convertedProjects: LevelDepartmentProjectItem[] = levels.map((lvl: any) => {
      const levelNumber = Number(lvl.levelNumber) || 1;
      const levelName = lvl.levelName || `Level ${levelNumber}`;
      const projectName =
        lvl.project?.projectName || `Dự Án Level ${levelNumber} - ${departmentName}`;
      const rewardItem =
        lvl.physicalItemName || `Thưởng thăng cấp Level ${levelNumber} - ${departmentName}`;

      const rawBullets: string[] =
        Array.isArray(lvl.project?.subTaskBullets) && lvl.project.subTaskBullets.length > 0
          ? lvl.project.subTaskBullets
          : [
              `Hoàn thành 100% chỉ tiêu KPI tháng cho Level ${levelNumber}`,
              `Thực hiện quy trình chuẩn hóa Level ${levelNumber} phòng ${departmentName}`,
            ];

      // Find existing project if any to preserve assigned user or progress
      const existingProject = this.findProjectList(departmentId, departmentName).find(
        (p) => p.levelNumber === levelNumber,
      );

      const subTasks: BulletSubTaskItem[] = rawBullets.map((bText: string, idx: number) => {
        const cleanTitle = String(bText).replace(/^[•\-\*]\s*/, '').trim();
        const subTaskId = `st_${levelNumber}_${idx + 1}`;
        const existingSub = existingProject?.subTasks?.find(
          (t) => t.id === subTaskId || t.orderNumber === idx + 1,
        );

        return {
          id: subTaskId,
          orderNumber: idx + 1,
          title: cleanTitle,
          targetKpi: 'Nghiệm thu đạt chuẩn 100%',
          status: existingSub?.status || 'PENDING',
          assignedUserId: existingSub?.assignedUserId,
          assignedUserName: existingSub?.assignedUserName,
          submissionNote: existingSub?.submissionNote,
          evidenceUrl: existingSub?.evidenceUrl,
          evidenceImages: existingSub?.evidenceImages,
          submittedAt: existingSub?.submittedAt,
          reviewedAt: existingSub?.reviewedAt,
          reviewedBy: existingSub?.reviewedBy,
        };
      });

      const completedCount = subTasks.filter(
        (t) => t.status === 'LEADER_APPROVED' || t.status === 'ADMIN_APPROVED',
      ).length;

      return {
        levelNumber,
        levelName,
        departmentName,
        projectName,
        totalSubTasks: subTasks.length,
        completedSubTasks: completedCount,
        rewardItem,
        subTasks,
      };
    });

    // Store in departmentProjects map
    this.departmentProjects.set(departmentId, convertedProjects);
    if (departmentName) {
      this.departmentProjects.set(departmentName, convertedProjects);
      this.departmentProjects.set(departmentName.toLowerCase().trim(), convertedProjects);
    }

    // Persist changes to disk storage
    this.saveToStorage();

    // Update GMV configs if provided in level items
    levels.forEach((lvl: any) => {
      const lvlNum = Number(lvl.levelNumber);
      if (lvlNum >= 1 && lvlNum <= 12 && (lvl.promotionCeilingGmv || lvl.retentionFloorGmv)) {
        const found = this.gmvConfigs.find((g) => g.levelNumber === lvlNum);
        if (found) {
          if (lvl.promotionCeilingGmv) found.promotionCeilingGmv = Number(lvl.promotionCeilingGmv);
          if (lvl.retentionFloorGmv) found.retentionFloorGmv = Number(lvl.retentionFloorGmv);
        }
      }
    });

    // Realtime broadcast to department and global listeners
    this.realtimeEvents.emitToDepartment(departmentId, 'level:config:updated', {
      departmentId,
      departmentName,
      year,
      levels,
      projects: convertedProjects,
    });
    this.realtimeEvents.emitToRoom('level:config_room', 'level:config:updated', {
      departmentId,
      departmentName,
      year,
      levels,
      projects: convertedProjects,
    });

    return { success: true, count: convertedProjects.length, departmentName };
  }

  private findProjectList(departmentId?: string, departmentName?: string): LevelDepartmentProjectItem[] {
    if (departmentId && this.departmentProjects.has(departmentId)) {
      return this.departmentProjects.get(departmentId)!;
    }
    if (departmentName) {
      if (this.departmentProjects.has(departmentName)) {
        return this.departmentProjects.get(departmentName)!;
      }
      const lower = departmentName.toLowerCase().trim();
      if (this.departmentProjects.has(lower)) {
        return this.departmentProjects.get(lower)!;
      }
    }
    return this.projects;
  }

  public getProjects(departmentId?: string, departmentName?: string): LevelDepartmentProjectItem[] {
    const list = this.findProjectList(departmentId, departmentName);
    if (list === this.projects && departmentName && departmentName !== 'Phòng Livestream TikTok') {
      // Clean template for specific department if not yet configured by admin
      return Array.from({ length: 8 }, (_, i) => {
        const lvlNum = i + 1;
        return {
          levelNumber: lvlNum,
          levelName: `Level ${lvlNum}`,
          departmentName: departmentName,
          projectName: `Dự Án Level ${lvlNum}`,
          totalSubTasks: 0,
          completedSubTasks: 0,
          rewardItem: '',
          subTasks: [],
        };
      });
    }
    return list;
  }

  public getProjectByLevel(
    levelNumber: number,
    departmentId?: string,
    departmentName?: string,
  ): LevelDepartmentProjectItem {
    const list = this.getProjects(departmentId, departmentName);
    const found = list.find((p) => p.levelNumber === levelNumber);
    if (!found) throw new NotFoundException(`Level ${levelNumber} project not found`);
    return found;
  }

  public assignSubTask(
    levelNumber: number,
    subTaskId: string,
    assignedUserId: string,
    assignedUserName: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.assignedUserId = assignedUserId;
    subTask.assignedUserName = assignedUserName;
    this.saveToStorage();
    return { success: true, subTask };
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
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.status = 'SUBMITTED';
    subTask.submissionNote = submissionNote;
    subTask.evidenceUrl = evidenceUrl;
    subTask.evidenceImages = evidenceImages;
    subTask.submittedAt = new Date().toISOString();
    this.saveToStorage();

    return { success: true, subTask };
  }

  public reviewSubTask(
    levelNumber: number,
    subTaskId: string,
    status: 'LEADER_APPROVED' | 'PENDING',
    reviewerName?: string,
    departmentId?: string,
    departmentName?: string,
  ) {
    const list = this.findProjectList(departmentId, departmentName);
    const project = list.find((p) => p.levelNumber === levelNumber);
    if (!project) throw new NotFoundException(`Project Level ${levelNumber} not found`);

    const subTask = project.subTasks.find((t) => t.id === subTaskId);
    if (!subTask) throw new NotFoundException(`SubTask ${subTaskId} not found`);

    subTask.status = status;
    subTask.reviewedAt = new Date().toISOString();
    subTask.reviewedBy = reviewerName;

    // Recalculate completed count
    project.completedSubTasks = project.subTasks.filter(
      (t) => t.status === 'LEADER_APPROVED' || t.status === 'ADMIN_APPROVED',
    ).length;
    this.saveToStorage();

    return { success: true, subTask, completedSubTasks: project.completedSubTasks };
  }

  public clearAllData() {
    this.departmentConfigs.clear();
    this.departmentProjects.clear();
    this.gmvConfigs.forEach((c) => {
      c.currentGmv = 0;
    });

    try {
      if (fs.existsSync(CONFIG_STORAGE_FILE)) fs.unlinkSync(CONFIG_STORAGE_FILE);
      if (fs.existsSync(PROJECT_STORAGE_FILE)) fs.unlinkSync(PROJECT_STORAGE_FILE);
    } catch {}

    return { success: true, message: 'Đã xóa sạch toàn bộ dữ liệu cấu hình Level, Dự án & GMV!' };
  }
}
