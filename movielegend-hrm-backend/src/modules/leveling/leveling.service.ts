import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PromotionRequestStatus } from '@prisma/client';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const CONFIG_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_configs.json');
const PROJECT_STORAGE_FILE = path.join(STORAGE_DIR, 'level_dept_projects.json');
const USER_LEVEL_STORAGE_FILE = path.join(STORAGE_DIR, 'level_user_levels.json');

export interface StandardLevelDefinition {
  levelNumber: number;
  levelName: string;
  defaultName: string;
  colorHex: string;
  defaultBadge: string;
  promotionCeilingGmv?: number;
  retentionFloorGmv?: number;
  minTenureMonths: number;
  targetShiftsCount: number;
}

export const STANDARD_LEVELS: StandardLevelDefinition[] = [
  { levelNumber: 1, levelName: 'Level 1', defaultName: 'Thực tập', colorHex: '#9E9E9E', defaultBadge: 'Thực tập', minTenureMonths: 1, targetShiftsCount: 26 },
  { levelNumber: 2, levelName: 'Level 2', defaultName: 'Chính thức', colorHex: '#2196F3', defaultBadge: 'Chính thức', minTenureMonths: 2, targetShiftsCount: 52 },
  { levelNumber: 3, levelName: 'Level 3', defaultName: 'Senior', colorHex: '#00BCD4', defaultBadge: 'Senior', minTenureMonths: 6, targetShiftsCount: 150 },
  { levelNumber: 4, levelName: 'Level 4', defaultName: 'Key Member', colorHex: '#4CAF50', defaultBadge: 'Key Member', minTenureMonths: 12, targetShiftsCount: 300 },
  { levelNumber: 5, levelName: 'Level 5', defaultName: 'Team Leader', colorHex: '#FF9800', defaultBadge: 'Leader', minTenureMonths: 18, targetShiftsCount: 450 },
  { levelNumber: 6, levelName: 'Level 6', defaultName: 'Manager', colorHex: '#E91E63', defaultBadge: 'Manager', minTenureMonths: 24, targetShiftsCount: 600 },
  { levelNumber: 7, levelName: 'Level 7', defaultName: 'Director', colorHex: '#9C27B0', defaultBadge: 'Director', minTenureMonths: 36, targetShiftsCount: 900 },
  { levelNumber: 8, levelName: 'Level 8', defaultName: 'Executive', colorHex: '#D4AF37', defaultBadge: 'Executive', minTenureMonths: 48, targetShiftsCount: 1200 },
];

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
  private userLevels = new Map<string, number>();

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

    try {
      if (fs.existsSync(USER_LEVEL_STORAGE_FILE)) {
        const raw = fs.readFileSync(USER_LEVEL_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => this.userLevels.set(k, Number(v)));
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

      const userLevelObj = Object.fromEntries(this.userLevels.entries());
      fs.writeFileSync(USER_LEVEL_STORAGE_FILE, JSON.stringify(userLevelObj, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  // =========================================================================
  // 1. DEPARTMENT LEVEL CUSTOM NAMES & CONFIGS
  // =========================================================================

  public async getDepartmentLevelConfigs(departmentId: string) {
    const dbConfigs = await this.prisma.departmentLevelConfig.findMany({
      where: { departmentId },
    });

    const configMap = new Map(dbConfigs.map((c) => [c.levelNumber, c]));

    return STANDARD_LEVELS.map((std) => {
      const custom = configMap.get(std.levelNumber);
      return {
        levelNumber: std.levelNumber,
        levelName: std.levelName,
        defaultName: std.defaultName,
        customLevelName: custom?.customLevelName || std.defaultName,
        displayName: custom?.customLevelName || std.defaultName,
        badgeTitle: custom?.badgeTitle || std.defaultBadge,
        colorHex: std.colorHex,
        minTenureMonths: std.minTenureMonths,
        targetShiftsCount: std.targetShiftsCount,
      };
    });
  }

  public async saveDepartmentLevelConfigs(
    departmentId: string,
    configs: Array<{ levelNumber: number; customLevelName: string; badgeTitle?: string }>,
    actor?: AuthenticatedUser,
  ) {
    const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new NotFoundException('Phòng ban không tồn tại');

    if (actor && !actor.roles.includes('ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      const allowedDepts = actor.scopes
        .filter((s) => s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId)
        .map((s) => s.scopeId as string);

      if (allowedDepts.length === 0) {
        const userDepts = await this.prisma.departmentMember.findMany({
          where: { userId: actor.userId, leftAt: null },
          select: { departmentId: true },
        });
        userDepts.forEach((d) => allowedDepts.push(d.departmentId));
      }

      if (!allowedDepts.includes(departmentId)) {
        throw new ForbiddenException('Bạn không có quyền cấu hình danh xưng cho phòng ban khác');
      }
    }

    const results = await this.prisma.$transaction(
      configs.map((c) =>
        this.prisma.departmentLevelConfig.upsert({
          where: {
            departmentId_levelNumber: {
              departmentId,
              levelNumber: c.levelNumber,
            },
          },
          create: {
            departmentId,
            levelNumber: c.levelNumber,
            customLevelName: c.customLevelName,
            badgeTitle: c.badgeTitle || c.customLevelName,
          },
          update: {
            customLevelName: c.customLevelName,
            badgeTitle: c.badgeTitle || c.customLevelName,
          },
        }),
      ),
    );

    this.realtimeEvents.emitToDepartment(departmentId, 'level:dept_config:updated', {
      departmentId,
      configs: results,
    });
    this.realtimeEvents.emitToRoom('level:config_room', 'level:dept_config:updated', {
      departmentId,
      configs: results,
    });

    return { success: true, count: results.length };
  }

  // =========================================================================
  // 2. USER PROGRESS & METRICS CALCULATION (%)
  // =========================================================================

  public async getUserLevelProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        departmentLinks: {
          where: { leftAt: null },
          include: { department: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy thông tin nhân sự');

    const currentLevelNumber = user.profile?.currentLevelNumber || this.userLevels.get(userId) || 1;
    const nextLevelNumber = Math.min(8, currentLevelNumber + 1);

    const primaryDept = user.departmentLinks[0]?.department;
    const departmentId = primaryDept?.id;

    // Lấy config của phòng ban
    let deptConfigs: any[] = [];
    if (departmentId) {
      deptConfigs = await this.getDepartmentLevelConfigs(departmentId);
    }
    const currentConfig = deptConfigs.find((c) => c.levelNumber === currentLevelNumber) || STANDARD_LEVELS.find((s) => s.levelNumber === currentLevelNumber);
    const nextConfig = deptConfigs.find((c) => c.levelNumber === nextLevelNumber) || STANDARD_LEVELS.find((s) => s.levelNumber === nextLevelNumber);

    // 1. Thâm niên (Tenure)
    const startDate = user.profile?.joinDate || user.createdAt;
    const now = new Date();
    const diffMs = now.getTime() - new Date(startDate).getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const tenureMonths = Number((diffDays / 30.44).toFixed(1));

    const targetMonths = nextConfig?.minTenureMonths || 6;
    const tenurePercent = Math.min(100, Math.round((tenureMonths / targetMonths) * 100));

    // 2. Số ca / Ngày công thực tế (Shifts / Workdays)
    const attendanceCount = await this.prisma.attendanceRecord.count({
      where: {
        userId,
        checkInAt: { not: undefined },
      },
    });

    const targetShifts = nextConfig?.targetShiftsCount || 100;
    const shiftsPercent = Math.min(100, Math.round((attendanceCount / targetShifts) * 100));

    // 3. Kỷ luật & Đúng giờ (Discipline Score)
    const lateCount = await this.prisma.attendanceRecord.count({
      where: {
        userId,
        lateMinutes: { gt: 0 },
      },
    });
    const disciplineScore = Math.max(0, 100 - lateCount * 2);
    const disciplinePercent = Math.min(100, disciplineScore);

    // 4. Doanh số GMV (nếu có cấu hình)
    const gmvItem = this.gmvConfigs.find((g) => g.levelNumber === nextLevelNumber);
    const targetGmv = gmvItem?.promotionCeilingGmv || 100;
    const currentGmv = gmvItem?.currentGmv || 0;
    const gmvPercent = Math.min(100, Math.round((currentGmv / targetGmv) * 100));

    // 5. Tính Overall Progress %
    // Weighted: 30% thâm niên + 35% ca làm + 20% kỷ luật + 15% gmv/nhiệm vụ
    const overallProgressPercent = Math.min(
      100,
      Math.round(tenurePercent * 0.3 + shiftsPercent * 0.35 + disciplinePercent * 0.2 + gmvPercent * 0.15),
    );

    // Kiểm tra đơn thăng cấp đang chờ xử lý (nếu có)
    const pendingRequest = await this.prisma.levelPromotionRequest.findFirst({
      where: {
        userId,
        status: { in: [PromotionRequestStatus.PENDING, PromotionRequestStatus.SUPPLEMENT_REQUESTED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId,
      fullName: user.profile?.fullName || user.userCode,
      avatarUrl: user.profile?.avatarUrl,
      departmentId,
      departmentName: primaryDept?.name || 'Chung',
      currentLevel: {
        levelNumber: currentLevelNumber,
        levelName: `Level ${currentLevelNumber}`,
        displayName: currentConfig?.customLevelName || currentConfig?.defaultName || `Level ${currentLevelNumber}`,
        badgeTitle: currentConfig?.badgeTitle || currentConfig?.defaultBadge || `Level ${currentLevelNumber}`,
        colorHex: currentConfig?.colorHex || '#2196F3',
      },
      nextLevel: {
        levelNumber: nextLevelNumber,
        levelName: `Level ${nextLevelNumber}`,
        displayName: nextConfig?.customLevelName || nextConfig?.defaultName || `Level ${nextLevelNumber}`,
        badgeTitle: nextConfig?.badgeTitle || nextConfig?.defaultBadge || `Level ${nextLevelNumber}`,
        colorHex: nextConfig?.colorHex || '#4CAF50',
      },
      overallProgressPercent,
      metrics: {
        tenure: {
          currentMonths: tenureMonths,
          targetMonths,
          percent: tenurePercent,
          startDate,
        },
        shifts: {
          currentCount: attendanceCount,
          targetCount: targetShifts,
          percent: shiftsPercent,
        },
        discipline: {
          lateCount,
          score: disciplineScore,
          percent: disciplinePercent,
        },
        gmv: {
          currentGmv,
          targetGmv,
          percent: gmvPercent,
          unit: gmvItem?.gmvUnit || 'Tr VNĐ',
        },
      },
      pendingRequest: pendingRequest
        ? {
            id: pendingRequest.id,
            status: pendingRequest.status,
            fromLevelNumber: pendingRequest.fromLevelNumber,
            toLevelNumber: pendingRequest.toLevelNumber,
            submissionNote: pendingRequest.submissionNote,
            evidenceImages: pendingRequest.evidenceImages,
            leaderNote: pendingRequest.leaderNote,
            createdAt: pendingRequest.createdAt,
          }
        : null,
    };
  }

  // =========================================================================
  // 3. EMPLOYEE SELF-PROMOTION REQUEST (WITH EVIDENCE IMAGES)
  // =========================================================================

  public async submitPromotionRequest(
    userId: string,
    dto: {
      fromLevelNumber: number;
      toLevelNumber: number;
      submissionNote: string;
      evidenceImages?: string[];
      departmentId?: string;
    },
  ) {
    let deptId = dto.departmentId;
    if (!deptId) {
      const link = await this.prisma.departmentMember.findFirst({
        where: { userId, leftAt: null, isPrimary: true },
      });
      deptId = link?.departmentId;
    }

    if (!deptId) {
      const anyLink = await this.prisma.departmentMember.findFirst({
        where: { userId, leftAt: null },
      });
      deptId = anyLink?.departmentId;
    }

    if (!deptId) {
      throw new BadRequestException('Bạn chưa thuộc phòng ban nào để nộp đề xuất lên cấp');
    }

    const created = await this.prisma.levelPromotionRequest.create({
      data: {
        userId,
        departmentId: deptId,
        fromLevelNumber: dto.fromLevelNumber,
        toLevelNumber: dto.toLevelNumber,
        submissionNote: dto.submissionNote,
        evidenceImages: dto.evidenceImages || [],
        status: PromotionRequestStatus.PENDING,
      },
      include: {
        user: { include: { profile: true } },
        department: true,
      },
    });

    // Thông báo cho Leader phòng ban
    this.realtimeEvents.emitToDepartment(deptId, 'level:promotion_request:created', {
      requestId: created.id,
      userId,
      userName: created.user.profile?.fullName || created.user.userCode,
      fromLevelNumber: created.fromLevelNumber,
      toLevelNumber: created.toLevelNumber,
      departmentId: deptId,
      departmentName: created.department?.name,
    });

    return created;
  }

  public async getDepartmentPromotionRequests(
    actor: AuthenticatedUser,
    departmentId?: string,
    status?: PromotionRequestStatus,
  ) {
    let targetDeptId = departmentId;
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('SUPER_ADMIN')) {
      const allowedDepts = actor.scopes
        .filter((s) => s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId)
        .map((s) => s.scopeId as string);

      if (allowedDepts.length === 0) {
        const userDepts = await this.prisma.departmentMember.findMany({
          where: { userId: actor.userId, leftAt: null },
          select: { departmentId: true },
        });
        userDepts.forEach((d) => allowedDepts.push(d.departmentId));
      }

      if (departmentId && !allowedDepts.includes(departmentId)) {
        throw new ForbiddenException('Bạn không có quyền xem đơn thăng cấp của phòng ban khác');
      }

      targetDeptId = departmentId || allowedDepts[0];
    }

    const where: any = {
      ...(targetDeptId ? { departmentId: targetDeptId } : {}),
      ...(status ? { status } : {}),
    };

    return this.prisma.levelPromotionRequest.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async reviewPromotionRequest(
    requestId: string,
    dto: {
      status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT_REQUESTED';
      leaderNote?: string;
    },
    actor: AuthenticatedUser,
  ) {
    const request = await this.prisma.levelPromotionRequest.findUnique({
      where: { id: requestId },
      include: { user: { include: { profile: true } } },
    });

    if (!request) throw new NotFoundException('Không tìm thấy đơn đề xuất');

    const updated = await this.prisma.levelPromotionRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status as PromotionRequestStatus,
        leaderNote: dto.leaderNote,
        decidedByUserId: actor.userId,
        decidedAt: new Date(),
      },
    });

    if (dto.status === 'APPROVED') {
      // 1. Cập nhật currentLevelNumber trong profile
      await this.prisma.employeeProfile.updateMany({
        where: { userId: request.userId },
        data: { currentLevelNumber: request.toLevelNumber },
      });

      // 2. Cập nhật memory & disk storage
      this.userLevels.set(request.userId, request.toLevelNumber);
      this.saveToStorage();

      // 3. Emit Realtime chúc mừng
      this.realtimeEvents.emitToUser(request.userId, 'level:promoted', {
        userId: request.userId,
        newLevelNumber: request.toLevelNumber,
        leaderNote: dto.leaderNote,
      });

      this.realtimeEvents.emitToRoom('level:config_room', 'level:user_promoted', {
        userId: request.userId,
        targetLevelNumber: request.toLevelNumber,
      });
    } else {
      // Emit Realtime phản hồi
      this.realtimeEvents.emitToUser(request.userId, 'level:promotion_request:feedback', {
        requestId,
        status: dto.status,
        leaderNote: dto.leaderNote,
      });
    }

    return updated;
  }

  // =========================================================================
  // 4. LEADER / ADMIN DIRECT LEVEL SETTING
  // =========================================================================

  public async setDirectUserLevel(
    targetUserId: string,
    levelNumber: number,
    note: string,
    actor: AuthenticatedUser,
  ) {
    if (levelNumber < 1 || levelNumber > 8) {
      throw new BadRequestException('Level phải từ 1 đến 8');
    }

    const isAdmin = actor.roles.includes('ADMIN') || actor.roles.includes('SUPER_ADMIN');
    if (!isAdmin) {
      if (levelNumber > 4) {
        throw new ForbiddenException('Leader chỉ được phép gán cấp từ Level 1 đến Level 4');
      }

      // Check if targetUser belongs to leader's department
      const allowedDepts = actor.scopes
        .filter((s) => s.role === 'LEADER' && s.scopeType === 'DEPARTMENT' && s.scopeId)
        .map((s) => s.scopeId as string);

      if (allowedDepts.length === 0) {
        const userDepts = await this.prisma.departmentMember.findMany({
          where: { userId: actor.userId, leftAt: null },
          select: { departmentId: true },
        });
        userDepts.forEach((d) => allowedDepts.push(d.departmentId));
      }

      const targetMember = await this.prisma.departmentMember.findFirst({
        where: { userId: targetUserId, leftAt: null, departmentId: { in: allowedDepts } },
      });

      if (!targetMember) {
        throw new ForbiddenException('Nhân sự này không thuộc phòng ban bạn quản lý');
      }
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });
    if (!targetUser) throw new NotFoundException('Không tìm thấy người dùng');

    await this.prisma.employeeProfile.updateMany({
      where: { userId: targetUserId },
      data: { currentLevelNumber: levelNumber },
    });

    this.userLevels.set(targetUserId, levelNumber);
    this.saveToStorage();

    // Lưu audit log
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'user.level.direct_update',
        entityType: 'User',
        entityId: targetUserId,
        metadata: {
          previousLevelNumber: targetUser.profile?.currentLevelNumber || 1,
          newLevelNumber: levelNumber,
          note,
        },
      },
    });

    // Realtime emit
    this.realtimeEvents.emitToUser(targetUserId, 'level:promoted', {
      userId: targetUserId,
      newLevelNumber: levelNumber,
      note,
    });

    this.realtimeEvents.emitToRoom('level:config_room', 'level:user_promoted', {
      userId: targetUserId,
      targetLevelNumber: levelNumber,
    });

    return { success: true, userId: targetUserId, newLevelNumber: levelNumber };
  }

  // =========================================================================
  // 5. EXISTING PROJECT / GMV / TASK COMPATIBILITY
  // =========================================================================

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

    this.departmentProjects.set(departmentId, convertedProjects);
    if (departmentName) {
      this.departmentProjects.set(departmentName, convertedProjects);
      this.departmentProjects.set(departmentName.toLowerCase().trim(), convertedProjects);
    }

    this.saveToStorage();

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

    project.completedSubTasks = project.subTasks.filter(
      (t) => t.status === 'LEADER_APPROVED' || t.status === 'ADMIN_APPROVED',
    ).length;
    this.saveToStorage();

    return { success: true, subTask, completedSubTasks: project.completedSubTasks };
  }

  public clearAllData() {
    this.departmentConfigs.clear();
    this.departmentProjects.clear();
    this.userLevels.clear();
    this.projects = [];
    this.gmvConfigs.forEach((c) => {
      c.currentGmv = 0;
    });

    try {
      if (fs.existsSync(CONFIG_STORAGE_FILE)) fs.unlinkSync(CONFIG_STORAGE_FILE);
      if (fs.existsSync(PROJECT_STORAGE_FILE)) fs.unlinkSync(PROJECT_STORAGE_FILE);
      if (fs.existsSync(USER_LEVEL_STORAGE_FILE)) fs.unlinkSync(USER_LEVEL_STORAGE_FILE);
    } catch {}

    this.realtimeEvents.emitToRoom('level:config_room', 'level:data_reset', { resetAt: Date.now() });
    this.realtimeEvents.emitToRoom('level:config_room', 'level:config:updated', { reset: true, levels: [] });

    return { success: true, message: 'Đã xóa sạch toàn bộ dữ liệu cấu hình Level, Dự án, Level Nhân sự & GMV!' };
  }

  public getUserLevel(userId: string): number {
    return this.userLevels.get(userId) || 1;
  }

  public updateUserLevel(userId: string, levelNumber: number) {
    this.userLevels.set(userId, levelNumber);
    this.saveToStorage();
    this.realtimeEvents.emitToRoom('level:config_room', 'level:user_promoted', {
      userId,
      targetLevelNumber: levelNumber,
      targetLevelName: `Level ${levelNumber}`,
    });
    return { success: true, userId, levelNumber };
  }
}
