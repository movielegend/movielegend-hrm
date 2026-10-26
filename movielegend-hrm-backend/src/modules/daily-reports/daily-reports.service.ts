import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { NotificationType } from '@prisma/client';
import {
  CreateDailyReportDto,
  ReviewDailyReportDto,
  ConvertPlanToTasksDto,
  CreateWorkTaskDto,
  UpdateWorkTaskDto,
  CreateWorkTaskUpdateDto,
  ApproveWorkTaskUpdateDto,
  AdminUpdateWorkTaskDto,
  TransferWorkTaskDto,
  QueryWorkTasksDto,
  BulkSaveWorkReportsDto,
} from './dto/daily-report.dto';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class DailyReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeEventsService,
    private readonly scopes: DepartmentScopeService
  ) {}

  /**
   * Helper: Kiểm tra chuỗi UUID hợp lệ để tránh lỗi crash Prisma
   */
  private isValidUuid(id?: string): boolean {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  /**
   * Helper: Tìm phòng ban chính của người dùng
   */
  private async getUserDepartmentId(userId: string): Promise<string | null> {
    // 1. Kiểm tra nếu là Trưởng phòng
    const ledDept = await this.prisma.department.findFirst({
      where: { leaderUserId: userId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (ledDept) return ledDept.id;

    // 2. Kiểm tra thành viên phòng
    const membership = await this.prisma.departmentMember.findFirst({
      where: { userId, leftAt: null },
      select: { departmentId: true },
    });
    if (membership) return membership.departmentId;

    // 3. Fallback bất kỳ phòng ban đầu tiên
    const anyDept = await this.prisma.department.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    return anyDept?.id || null;
  }

  private async generateTaskCode(): Promise<string> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CV${Date.now().toString().slice(-6)}${randomSuffix}`;
  }

  private async upsertSingleWorkTask(data: {
    taskId?: string;
    userId: string;
    departmentId: string;
    category: string;
    title: string;
    description?: string | null;
    taskType: string;
    priority: string;
    deadline?: string | null;
    workStatus: string;
    progress: number;
    notes?: string | null;
    obstacles?: string | null;
    supportRequest?: string | null;
    attachments?: any;
    selfRating?: number;
    reportDate: string;
    isDraft?: boolean;
    metricName?: string;
  }) {
    let task: any = null;
    if (data.taskId) {
      task = await this.prisma.workTask.findUnique({ where: { id: data.taskId } });
    }
    if (!task) {
      // Chuẩn hóa tên nhiệm vụ để so khớp thông minh, chống sinh 2 dòng trùng
      const rawBase = (data.metricName || data.title.split(':')[0]).trim().toLowerCase();

      const existingTasks = await this.prisma.workTask.findMany({
        where: {
          userId: data.userId,
          reportDate: data.reportDate,
          isDeleted: false,
        },
      });

      task = existingTasks.find((t) => {
        const tTitle = (t.title || '').trim().toLowerCase();
        const tBase = tTitle.split(':')[0].trim();
        return (
          tTitle === data.title.trim().toLowerCase() ||
          tBase === rawBase ||
          tTitle.startsWith(rawBase) ||
          rawBase.startsWith(tBase)
        );
      });
    }

    if (task) {
      // TUYỆT ĐỐI KHÔNG cập nhật nhiệm vụ đã APPROVED qua DailyReport sync
      if (task.approvalStatus === 'APPROVED') {
        return task;
      }
      await this.prisma.workTask.update({
        where: { id: task.id },
        data: {
          title: data.title,
          category: data.category || task.category,
          description: data.description !== undefined ? data.description : task.description,
          taskType: data.taskType || task.taskType,
          priority: data.priority || task.priority,
          deadline: data.deadline !== undefined ? data.deadline : task.deadline,
          workStatus: data.workStatus || task.workStatus,
        }
      });

      const existingUpdate = await this.prisma.workTaskUpdate.findUnique({
        where: { taskId_reportDate: { taskId: task.id, reportDate: data.reportDate } }
      });
      if (existingUpdate) {
        await this.prisma.workTaskUpdate.update({
          where: { id: existingUpdate.id },
          data: {
            progress: data.progress,
            workStatus: data.workStatus,
            notes: data.notes || existingUpdate.notes,
            obstacles: data.obstacles || existingUpdate.obstacles,
            supportRequest: data.supportRequest || existingUpdate.supportRequest,
            selfRating: data.selfRating ?? existingUpdate.selfRating,
            attachments: (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0)
              ? (data.attachments as any)
              : undefined,
            isDraft: (!existingUpdate.isDraft && (existingUpdate.approvalStatus === 'APPROVED' || existingUpdate.approvalStatus === 'PENDING'))
              ? false
              : (data.isDraft ?? existingUpdate.isDraft),
          }
        });
      } else {
        await this.prisma.workTaskUpdate.create({
          data: {
            taskId: task.id,
            reportDate: data.reportDate,
            progress: data.progress,
            workStatus: data.workStatus,
            notes: data.notes,
            obstacles: data.obstacles,
            supportRequest: data.supportRequest,
            selfRating: data.selfRating ?? 5,
            attachments: (data.attachments as any) || [],
            reportedByUserId: data.userId,
            isDraft: data.isDraft ?? false,
          }
        });
      }
    } else {
      const taskCode = await this.generateTaskCode();
      task = await this.prisma.workTask.create({
        data: {
          taskCode,
          userId: data.userId,
          createdByUserId: data.userId,
          departmentId: data.departmentId,
          category: data.category || 'Vận hành',
          title: data.title,
          description: data.description || null,
          taskType: data.taskType || 'THEO_KE_HOACH',
          priority: data.priority || 'MEDIUM',
          deadline: data.deadline || null,
          workStatus: data.workStatus || 'IN_PROGRESS',
          approvalStatus: 'PENDING',
          reportDate: data.reportDate,
          updates: {
            create: {
              reportDate: data.reportDate,
              progress: data.progress,
              workStatus: data.workStatus || 'IN_PROGRESS',
              approvalStatus: 'PENDING',
              notes: data.notes || null,
              obstacles: data.obstacles || null,
              supportRequest: data.supportRequest || null,
              selfRating: data.selfRating ?? 5,
              attachments: (data.attachments as any) || [],
              reportedByUserId: data.userId,
              isDraft: data.isDraft ?? false,
            }
          }
        }
      });
    }
    return task;
  }

  private async syncToWorkTasks(userId: string, departmentId: string, reportDate: string, dto: CreateDailyReportDto, isDraft: boolean) {
    try {
      // Tuyệt đối không tự động sinh WorkTask cho Quản trị viên hệ thống (Admin)
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          userCode: true,
          roles: { select: { role: { select: { code: true } } } }
        }
      });
      const roles = targetUser?.roles?.map(r => r.role?.code) || [];
      if (targetUser?.userCode === 'NV000001' || roles.some(rc => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(rc))) {
        return;
      }
      const syncedTaskIds = new Set<string>();
      const syncedBaseTitles = new Set<string>();

      // 1. Sync metrics trước (Danh sách nhiệm vụ chuẩn hóa đầy đủ số lượng, file đính kèm & đánh giá)
      const metrics = Array.isArray(dto.metrics) ? dto.metrics : [];
      for (const m of metrics as any[]) {
        if (!m) continue;
        const taskTitle = (m.name || m.title || '').trim();
        if (!taskTitle) continue;

        const title = m.value ? `${taskTitle}: ${m.value} ${m.unit || ''}`.trim() : taskTitle;
        const workStatus = m.status || (m.progress === 100 ? 'DONE' : 'IN_PROGRESS');
        const progress = workStatus === 'DONE' ? 100 : (m.progress ?? (workStatus === 'NOT_STARTED' ? 0 : 50));

        const task = await this.upsertSingleWorkTask({
          taskId: m.taskId,
          metricName: m.name || m.title,
          userId,
          departmentId,
          category: m.category || 'Vận hành',
          title,
          description: m.description || m.notes || null,
          taskType: m.taskType || 'THEO_KE_HOACH',
          priority: m.priority || 'MEDIUM',
          deadline: m.deadline || null,
          workStatus,
          progress,
          notes: m.notes || m.note || null,
          obstacles: m.obstacles || null,
          supportRequest: m.supportRequest || null,
          attachments: m.attachments,
          selfRating: m.selfRating,
          reportDate,
          isDraft,
        });

        if (task?.id) syncedTaskIds.add(task.id);
        if (m.taskId) syncedTaskIds.add(m.taskId);
        syncedBaseTitles.add(taskTitle.toLowerCase());
        syncedBaseTitles.add(title.toLowerCase());
      }

      // 2. Sync completedTasks (chỉ sync những task chưa có trong metrics để chống trùng lặp)
      const completed = Array.isArray(dto.completedTasks) ? dto.completedTasks : [];
      for (const t of completed as any[]) {
        if (!t || !t.title || t.isSelected === false) continue;
        const cleanTitle = t.title.trim().toLowerCase();
        const baseTitle = cleanTitle.split(':')[0].trim();
        if (t.taskId && syncedTaskIds.has(t.taskId)) continue;
        if (syncedBaseTitles.has(cleanTitle) || syncedBaseTitles.has(baseTitle)) continue;

        await this.upsertSingleWorkTask({
          taskId: t.taskId,
          userId,
          departmentId,
          category: t.category || 'Vận hành',
          title: t.title,
          description: t.description || null,
          taskType: t.taskType || 'THEO_KE_HOACH',
          priority: t.priority || 'MEDIUM',
          deadline: t.deadline || null,
          workStatus: 'DONE',
          progress: 100,
          notes: t.notes || t.note || null,
          obstacles: t.obstacles || null,
          supportRequest: t.supportRequest || null,
          reportDate,
          isDraft,
        });
      }

      // 3. Sync inProgressTasks (chỉ sync những task chưa có trong metrics để chống trùng lặp)
      const inProgress = Array.isArray(dto.inProgressTasks) ? dto.inProgressTasks : [];
      for (const t of inProgress as any[]) {
        if (!t || !t.title) continue;
        const cleanTitle = t.title.trim().toLowerCase();
        const baseTitle = cleanTitle.split(':')[0].trim();
        if (t.taskId && syncedTaskIds.has(t.taskId)) continue;
        if (syncedBaseTitles.has(cleanTitle) || syncedBaseTitles.has(baseTitle)) continue;

        await this.upsertSingleWorkTask({
          taskId: t.taskId,
          userId,
          departmentId,
          category: t.category || 'Vận hành',
          title: t.title,
          description: t.description || null,
          taskType: t.taskType || 'THEO_KE_HOACH',
          priority: t.priority || 'MEDIUM',
          deadline: t.deadline || t.expectedDate || null,
          workStatus: 'IN_PROGRESS',
          progress: typeof t.progress === 'number' ? t.progress : 50,
          notes: t.notes || t.note || null,
          obstacles: t.obstacles || null,
          supportRequest: t.supportRequest || null,
          reportDate,
          isDraft,
        });
      }

      // Phát realtime event để cập nhật bảng Excel trên Web
      this.realtime.emitToDepartment(departmentId, 'work-report:department_updated', {
        departmentId,
        action: 'DAILY_REPORT_SYNC',
        reportDate,
      });
    } catch (err) {
      console.error('[DailyReportsService] syncToWorkTasks error:', err);
    }
  }

  /**
   * 1. Tạo hoặc Cập nhật báo cáo cuối ngày
   */
  async createOrUpdateReport(actor: AuthenticatedUser, dto: CreateDailyReportDto) {
    const userId = actor.userId;
    const reportDate = dto.reportDate || getTodayString();
    let departmentId = await this.getUserDepartmentId(userId);

    if (!departmentId) {
      throw new BadRequestException('Không tìm thấy phòng ban của người dùng');
    }

    const isLeader = actor.roles.includes('LEADER');
    const roleType = dto.roleType || (isLeader ? 'LEADER' : 'EMPLOYEE');

    // Kiểm tra xem báo cáo ngày này đã tồn tại chưa
    const existing = await this.prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate } },
      include: { reviewedBy: { select: { profile: { select: { fullName: true } } } } },
    });

    const hasOpenOrRejectedTasks = await this.prisma.workTask.count({
      where: {
        userId,
        reportDate,
        approvalStatus: { in: ['REJECTED', 'NEED_MORE_INFO', 'PENDING'] },
        isDeleted: false,
      },
    });

    if (existing && !dto.isDraft && existing.status === 'REVIEWED' && hasOpenOrRejectedTasks === 0) {
      throw new ForbiddenException(
        `Báo cáo ngày ${reportDate} đã được ${existing.reviewedBy?.profile?.fullName || 'Admin'} đánh giá hoàn tất, không thể chỉnh sửa.`
      );
    }

    // Bảo vệ trạng thái báo cáo: Nếu đã SUBMITTED / REVIEWED / REJECTED thì lưu nháp (isDraft=true) không bao giờ làm tụt về DRAFT
    const createStatus = dto.isDraft ? 'DRAFT' : 'SUBMITTED';
    const updateStatus = dto.isDraft
      ? (existing && existing.status !== 'DRAFT' ? existing.status : 'DRAFT')
      : (existing?.status === 'REVIEWED' ? 'REVIEWED' : 'SUBMITTED');

    const rawIncomingMetrics = Array.isArray(dto.metrics) ? (dto.metrics as any[]) : [];
    const unifiedMetrics = rawIncomingMetrics.map((m: any) => ({
      ...m,
      approvalStatus: !dto.isDraft ? 'PENDING' : (m.approvalStatus || 'PENDING'),
    }));

    // Hợp nhất metrics thông minh: Giữ nguyên các nhiệm vụ hiện có trong DailyReport nếu không nằm trong danh sách gửi đợt này
    let finalMetrics = unifiedMetrics;
    if (existing && Array.isArray(existing.metrics) && existing.metrics.length > 0 && dto.metrics !== undefined) {
      const existingMetrics = existing.metrics as any[];
      const incomingTaskIds = new Set(unifiedMetrics.map((m: any) => m.taskId).filter(Boolean));
      const incomingTitles = new Set(unifiedMetrics.map((m: any) => (m.name || m.title || '').trim().toLowerCase()));

      const preserved = existingMetrics.filter((em: any) => {
        if (em.taskId && incomingTaskIds.has(em.taskId)) return false;
        const t = (em.name || em.title || '').trim().toLowerCase();
        if (t && incomingTitles.has(t)) return false;
        return true;
      });
      finalMetrics = [...preserved, ...unifiedMetrics];
    }

    const derivedCompleted = finalMetrics
      .filter((m) => m.status === 'DONE' && Boolean((m.name || m.title || '').trim()))
      .map((m, idx) => ({
        taskId: m.taskId,
        taskCode: m.taskCode || `CV${String(idx + 1).padStart(3, '0')}`,
        title: m.name || m.title || '',
        description: m.description || '',
        category: m.category || 'Vận hành',
        taskType: m.taskType || 'THEO_KE_HOACH',
        priority: m.priority || 'MEDIUM',
        deadline: m.deadline || '',
        status: 'DONE',
        progress: 100,
        notes: m.notes || m.note || '',
        obstacles: m.obstacles || '',
        supportRequest: m.supportRequest || '',
        approvalStatus: m.approvalStatus || 'PENDING',
        approvalNote: m.approvalNote || null,
        isSelected: true,
      }));

    const derivedInProgress = finalMetrics
      .filter((m) => m.status !== 'DONE' && Boolean((m.name || m.title || '').trim()))
      .map((m, idx) => ({
        taskId: m.taskId,
        taskCode: m.taskCode || `CV${String(idx + 1).padStart(3, '0')}`,
        title: m.name || m.title || '',
        description: m.description || '',
        category: m.category || 'Vận hành',
        taskType: m.taskType || 'THEO_KE_HOACH',
        priority: m.priority || 'MEDIUM',
        deadline: m.deadline || '',
        status: m.status || 'IN_PROGRESS',
        progress: m.progress ?? (m.status === 'NOT_STARTED' ? 0 : 50),
        expectedDate: m.deadline || '',
        notes: m.notes || m.note || '',
        obstacles: m.obstacles || '',
        supportRequest: m.supportRequest || '',
        approvalStatus: m.approvalStatus || 'PENDING',
        approvalNote: m.approvalNote || null,
      }));

    const report = await this.prisma.dailyReport.upsert({
      where: { userId_reportDate: { userId, reportDate } },
      create: {
        userId,
        departmentId,
        reportDate,
        roleType,
        metrics: (finalMetrics as any) || [],
        completedTasks: (derivedCompleted as any) || [],
        inProgressTasks: (derivedInProgress as any) || [],
        obstacles: dto.obstacles || null,
        tomorrowPlan: (dto.tomorrowPlan as any) || [],
        attachments: (dto.attachments as any) || [],
        selfRating: dto.selfRating || 5,
        selfReview: dto.selfReview || null,
        status: createStatus,
      },
      update: {
        metrics: dto.metrics !== undefined ? (finalMetrics as any) : undefined,
        completedTasks: dto.metrics !== undefined ? (derivedCompleted as any) : (dto.completedTasks !== undefined ? (dto.completedTasks as any) : undefined),
        inProgressTasks: dto.metrics !== undefined ? (derivedInProgress as any) : (dto.inProgressTasks !== undefined ? (dto.inProgressTasks as any) : undefined),
        obstacles: dto.obstacles !== undefined ? dto.obstacles : undefined,
        tomorrowPlan: dto.tomorrowPlan !== undefined ? (dto.tomorrowPlan as any) : undefined,
        attachments: dto.attachments !== undefined ? (dto.attachments as any) : undefined,
        selfRating: dto.selfRating !== undefined ? dto.selfRating : undefined,
        selfReview: dto.selfReview !== undefined ? dto.selfReview : undefined,
        status: updateStatus,
        departmentId,
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    // Tự động đồng bộ các công việc và chỉ tiêu nhân viên đã nhập vào bảng Excel (WorkTask)
    await this.syncToWorkTasks(userId, departmentId, reportDate, dto, Boolean(dto.isDraft));

    // Nếu là nộp chính thức (!dto.isDraft), phát thông báo
    if (!dto.isDraft) {
      const senderName = report.user?.profile?.fullName || report.user?.userCode || 'Nhân sự';
      const deptName = report.department?.name || 'Phòng ban';

      // 1. Bắn realtime event
      this.realtime.emitToDepartment(departmentId, 'daily_report:submitted', {
        reportId: report.id,
        userId,
        senderName,
        reportDate,
        roleType,
      });

      // 2. Gửi thông báo đến Leader (nếu là nhân viên nộp) và Admin
      setImmediate(async () => {
        try {
          const notifyUserIds = new Set<string>();

          // Tìm Leader của phòng
          const dept = await this.prisma.department.findUnique({
            where: { id: departmentId! },
            select: { leaderUserId: true },
          });
          if (dept?.leaderUserId && dept.leaderUserId !== userId) {
            notifyUserIds.add(dept.leaderUserId);
          }

          // Tìm các Admin quản lý (Global + Regional)
          const adminRoles = await this.prisma.userRole.findMany({
            where: {
              role: { code: { in: ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'] } },
            },
            select: { userId: true, scopeType: true, scopeId: true },
          });

          for (const ar of adminRoles) {
            if (ar.userId === userId) continue;
            // Global admin hoặc Admin miền chứa phòng ban
            if (ar.scopeType === 'GLOBAL' || !ar.scopeType) {
              notifyUserIds.add(ar.userId);
            }
          }

          const targetList = Array.from(notifyUserIds);
          if (targetList.length > 0) {
            await this.prisma.$transaction(async (tx) => {
              const payload = await this.notifications.createForUsers(tx as any, targetList, {
                type: 'TASK_UPDATED',
                title: `Báo cáo cuối ngày: ${senderName} (${deptName})`,
                body: `Nhân sự ${senderName} đã nộp báo cáo ngày ${reportDate}.`,
                metadata: {
                  reportId: report.id,
                  reportDate,
                  userId,
                  senderName,
                  departmentId,
                  roleType,
                  category: 'DAILY_REPORT',
                  type: 'DAILY_REPORT_SUBMITTED',
                },
              });
              if (payload) this.notifications.emitCreated(payload);
            });
          }
        } catch (e) {
          console.error('[DailyReports] Failed to send submit notification:', e);
        }
      });
    }

    return report;
  }

  /**
   * 2. Lấy báo cáo ngày hôm nay của người dùng (nếu chưa có thì gợi ý auto-pull task)
   */
  async getMyTodayReport(actor: AuthenticatedUser, dateStr?: string) {
    const userId = actor.userId;
    const reportDate = dateStr || getTodayString();

    const existing = await this.prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate } },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    if (existing) {
      const [enriched] = await this.enrichReportsWithLiveTasks([existing]);
      return enriched;
    }

    // Nếu chưa có báo cáo ngày này, tự động quét các Task của user trong hệ thống
    const [departmentId, userProfile, userTasks] = await Promise.all([
      this.getUserDepartmentId(userId),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      this.prisma.taskAssignment.findMany({
        where: {
          userId,
          status: { in: ['COMPLETED', 'ACCEPTED', 'IN_PROGRESS', 'WAITING_REVIEW'] },
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              dueAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 30,
      }),
    ]);

    const dept = departmentId
      ? await this.prisma.department.findUnique({
          where: { id: departmentId },
          select: { id: true, name: true },
        })
      : null;

    // Tự động phân loại Task hoàn thành & Task đang làm (hệ thống giao việc)
    const completedTasks: any[] = [];
    const inProgressTasks: any[] = [];

    for (const a of userTasks) {
      const t = a.task;
      if (!t) continue;

      if (a.status === 'COMPLETED' || (t.status as any) === 'COMPLETED') {
        completedTasks.push({
          taskId: t.id,
          title: t.title,
          status: 'COMPLETED',
          isManual: false,
        });
      } else {
        inProgressTasks.push({
          taskId: t.id,
          title: t.title,
          status: a.status || t.status || 'IN_PROGRESS',
          expectedDate: t.dueAt ? new Date(t.dueAt).toISOString().split('T')[0] : undefined,
          note: '',
          isManual: false,
        });
      }
    }

    // Tự động chuyển tiếp việc dở dang từ báo cáo ngày gần nhất (Auto Carryover)
    const carriedOverMetrics: any[] = [];
    try {
      const lastReport = await this.prisma.dailyReport.findFirst({
        where: {
          userId,
          reportDate: { lt: reportDate },
          status: { in: ['SUBMITTED', 'REVIEWED'] },
        },
        orderBy: { reportDate: 'desc' },
      });

      if (lastReport) {
        const prevMetrics = Array.isArray(lastReport.metrics) ? (lastReport.metrics as any[]) : [];
        for (const m of prevMetrics) {
          const isDone = m.status === 'DONE' || Number(m.progress) >= 100;
          const name = (m.name || m.title || '').trim();
          if (name && !isDone) {
            carriedOverMetrics.push({
              name,
              description: m.description || '',
              value: m.value || '',
              unit: m.unit || '',
              category: m.category || 'Vận hành',
              taskType: m.taskType || 'THEO_KE_HOACH',
              priority: m.priority || 'MEDIUM',
              deadline: m.deadline || '',
              status: m.status || 'IN_PROGRESS',
              progress: m.progress ?? 50,
              isCarriedOver: true,
              note: m.note || m.notes || '',
              notes: m.notes || m.note || '',
              obstacles: m.obstacles || '',
              supportRequest: m.supportRequest || '',
            });
          }
        }

        // Kiểm tra tương thích thêm inProgressTasks cũ nếu có
        const prevInProgress = Array.isArray(lastReport.inProgressTasks) ? (lastReport.inProgressTasks as any[]) : [];
        for (const t of prevInProgress) {
          const title = (t.title || t.name || '').trim();
          if (title && !carriedOverMetrics.some((cm) => cm.name === title)) {
            carriedOverMetrics.push({
              name: title,
              description: t.description || '',
              category: t.category || 'Vận hành',
              taskType: t.taskType || 'THEO_KE_HOACH',
              priority: t.priority || 'MEDIUM',
              deadline: t.deadline || t.expectedDate || '',
              status: 'IN_PROGRESS',
              progress: t.progress ?? 50,
              isCarriedOver: true,
              note: t.note || t.notes || '',
              notes: t.notes || t.note || '',
              obstacles: t.obstacles || '',
              supportRequest: t.supportRequest || '',
            });
          }
        }
      }
    } catch (e) {
      console.warn('[DailyReports] Auto carryover lookup failed:', e);
    }

    // Mặc định luôn chỉ có 1 nhiệm vụ làm mẫu ban đầu, người dùng muốn thêm sẽ bấm "+ Thêm nhiệm vụ"
    const defaultMetrics = [
      {
        name: '',
        value: '',
        note: '',
        category: 'Vận hành',
        taskType: 'THEO_KE_HOACH',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        progress: 50,
        deadline: '',
        description: '',
        isCarriedOver: false,
      },
    ];

    return {
      id: null,
      userId,
      departmentId,
      reportDate,
      roleType: actor.roles.includes('LEADER') ? 'LEADER' : 'EMPLOYEE',
      metrics: defaultMetrics,
      completedTasks,
      inProgressTasks,
      obstacles: '',
      tomorrowPlan: [],
      attachments: [],
      selfRating: 5,
      selfReview: '',
      status: 'DRAFT',
      user: {
        id: userId,
        userCode: userProfile?.userCode || '',
        profile: {
          fullName: userProfile?.profile?.fullName || userProfile?.userCode || 'Nhân sự',
          avatarUrl: userProfile?.profile?.avatarUrl || null,
        },
      },
      department: dept,
      reviewedBy: null,
    };
  }

  /**
   * 3. Lịch sử báo cáo cá nhân của tôi
   */
  async getMyReportHistory(actor: AuthenticatedUser, page = 1, limit = 20, month?: string) {
    const userId = actor.userId;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (month) {
      where.reportDate = { startsWith: month }; // e.g. "2026-09"
    }

    const [items, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.dailyReport.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Helper: Lấy danh sách ID các phòng ban mà actor có quyền Leader/quản lý
   */
  private async getLeaderDepartmentIds(actor: AuthenticatedUser): Promise<string[]> {
    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );
    if (isGlobalAdmin) {
      const allDepts = await this.prisma.department.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true },
      });
      return allDepts.map((d) => d.id);
    }

    const deptIds = new Set<string>();

    // 1. Lấy từ scopes service (bao gồm JWT scopes và department.leaderUserId)
    try {
      const fromScopesService = await this.scopes.getLedDepartmentIds(actor);
      fromScopesService.forEach((id) => deptIds.add(id));
    } catch {}

    // 2. Lấy trực tiếp từ bảng Department theo leaderUserId
    const ledDepts = await this.prisma.department.findMany({
      where: { leaderUserId: actor.userId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    ledDepts.forEach((d) => deptIds.add(d.id));

    // 3. Lấy từ bảng UserRole trực tiếp trong database nếu JWT scopes chưa cập nhật
    const leaderUserRoles = await this.prisma.userRole.findMany({
      where: {
        userId: actor.userId,
        role: { code: { in: ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER'] } },
        scopeType: 'DEPARTMENT',
        scopeId: { not: null },
      },
      select: { scopeId: true },
    });
    leaderUserRoles.forEach((ur) => {
      if (ur.scopeId) deptIds.add(ur.scopeId);
    });

    // 4. Nếu actor có role LEADER nhưng chưa gán scopeId rõ ràng, bổ sung phòng ban thành viên của họ
    const isLeaderRole =
      actor.roles.some((r) => ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(r)) ||
      leaderUserRoles.length > 0;

    if (isLeaderRole && deptIds.size === 0) {
      const members = await this.prisma.departmentMember.findMany({
        where: { userId: actor.userId, leftAt: null },
        select: { departmentId: true },
      });
      members.forEach((m) => deptIds.add(m.departmentId));
    }

    return Array.from(deptIds);
  }

  /**
   * Helper: Đồng bộ trạng thái thực tế từ WorkTask (Web grid) sang DailyReport (Mobile app)
   */
  async enrichReportsWithLiveTasks<T extends any>(reports: T[]): Promise<T[]> {
    if (!reports || reports.length === 0) return reports;

    const pairs = reports
      .filter((r: any) => r && r.userId && r.reportDate)
      .map((r: any) => ({ userId: r.userId, reportDate: r.reportDate }));

    if (pairs.length === 0) return reports;

    const tasks = await this.prisma.workTask.findMany({
      where: {
        OR: pairs.map((p) => ({ userId: p.userId, reportDate: p.reportDate })),
        isDeleted: false,
      },
      include: {
        updates: true,
      },
    });

    const userDateTaskMap = new Map<string, any[]>();
    for (const t of tasks) {
      const key = `${t.userId}_${t.reportDate}`;
      let list = userDateTaskMap.get(key);
      if (!list) {
        list = [];
        userDateTaskMap.set(key, list);
      }
      list.push(t);
    }

    const updatedReports = await Promise.all(
      reports.map(async (r: any) => {
        if (!r || !r.userId || !r.reportDate) return r;
        const key = `${r.userId}_${r.reportDate}`;
        const userTasks = userDateTaskMap.get(key) || [];
        if (userTasks.length === 0) return r;

        const taskMap = new Map<string, any>();
        for (const t of userTasks) {
          const update = t.updates?.find((u: any) => u.reportDate === r.reportDate) || t.updates?.[0];
          const info = {
            approvalStatus: t.approvalStatus,
            approvalNote: update?.approvalNote || null,
            workStatus: t.workStatus,
          };
          taskMap.set(t.id, info);
          taskMap.set((t.title || '').trim().toLowerCase(), info);
          const base = (t.title || '').split(':')[0].trim().toLowerCase();
          taskMap.set(base, info);
        }

        const syncItems = (items: any) => {
          if (!Array.isArray(items)) return items;
          return items.map((item) => {
            const byId = item.taskId ? taskMap.get(item.taskId) : null;
            const byTitle = item.title
              ? taskMap.get((item.title || '').trim().toLowerCase()) ||
                taskMap.get((item.title || '').split(':')[0].trim().toLowerCase())
              : null;
            const byName = item.name
              ? taskMap.get((item.name || '').trim().toLowerCase()) ||
                taskMap.get((item.name || '').split(':')[0].trim().toLowerCase())
              : null;
            const match = byId || byTitle || byName;
            if (match) {
              return {
                ...item,
                approvalStatus: match.approvalStatus || item.approvalStatus,
                approvalNote: match.approvalNote || item.approvalNote,
              };
            }
            return item;
          });
        };

        const enrichedMetrics = syncItems(r.metrics);
        const enrichedCompleted = syncItems(r.completedTasks);
        const enrichedInProgress = syncItems(r.inProgressTasks);

        const allRejected =
          userTasks.length > 0 && userTasks.every((t) => t.approvalStatus === 'REJECTED');
        const firstRejection = userTasks.find((t) => t.approvalStatus === 'REJECTED');
        const firstNote =
          firstRejection?.updates?.find((u: any) => u.reportDate === r.reportDate)?.approvalNote ||
          firstRejection?.updates?.[0]?.approvalNote;

        let newStatus = r.status;
        let newAdminReview = r.adminReview;
        if (allRejected) {
          newStatus = 'REJECTED';
          if (firstNote) newAdminReview = firstNote;
        }

        // Tự động persist vào database nếu trạng thái hoặc metrics bị lệch
        if (allRejected && r.status !== 'REJECTED' && r.id) {
          this.prisma.dailyReport
            .update({
              where: { id: r.id },
              data: {
                status: 'REJECTED',
                adminReview: newAdminReview,
                metrics: enrichedMetrics,
                completedTasks: enrichedCompleted,
                inProgressTasks: enrichedInProgress,
              },
            })
            .catch(() => {});
        }

        return {
          ...r,
          metrics: enrichedMetrics,
          completedTasks: enrichedCompleted,
          inProgressTasks: enrichedInProgress,
          status: newStatus,
          adminReview: newAdminReview,
        };
      })
    );

    return updatedReports;
  }

  /**
   * 4. Leader xem danh sách báo cáo phòng ban theo ngày
   */
  async getDepartmentReports(actor: AuthenticatedUser, departmentId?: string, dateStr?: string) {
    const reportDate = dateStr || getTodayString();
    let targetDeptId = departmentId;

    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );

    if (!isGlobalAdmin) {
      const leaderDeptIds = await this.getLeaderDepartmentIds(actor);
      if (leaderDeptIds.length === 0) {
        throw new ForbiddenException('Bạn không có quyền quản lý phòng ban nào');
      }

      if (targetDeptId) {
        if (!leaderDeptIds.includes(targetDeptId)) {
          throw new ForbiddenException('Bạn chỉ có thể xem báo cáo của phòng ban mình phụ trách');
        }
      } else {
        targetDeptId = leaderDeptIds[0];
      }
    } else {
    if (!targetDeptId) {
      targetDeptId = (await this.getUserDepartmentId(actor.userId)) || undefined;
    }
    }

    const isAccountant = this.scopes.isAccountant(actor) && !this.scopes.isGlobalAdmin(actor) && !actor.roles.includes('ADMIN');
    if (isAccountant) {
      const myDeptId = (await this.getUserDepartmentId(actor.userId)) || undefined;
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const allowedDepts = new Set<string>();
      if (myDeptId) allowedDepts.add(myDeptId);
      ledDepts.forEach((id) => allowedDepts.add(id));

      if (targetDeptId && !allowedDepts.has(targetDeptId)) {
        throw new ForbiddenException('Kế toán không được xem báo cáo của phòng ban khác');
      }
      if (!targetDeptId) {
        targetDeptId = myDeptId || Array.from(allowedDepts)[0];
      }
    }

    if (!targetDeptId) {
      throw new BadRequestException('Vui lòng chọn phòng ban');
    }

    // Lấy tất cả thành viên trong phòng ban
    const members = await this.prisma.departmentMember.findMany({
      where: { departmentId: targetDeptId, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            profile: { select: { fullName: true, avatarUrl: true } },
            roles: { include: { role: true } },
          },
        },
      },
    });

    // Lấy tất cả báo cáo đã nộp của phòng ngày hôm đó
    const rawReports = await this.prisma.dailyReport.findMany({
      where: {
        departmentId: targetDeptId,
        reportDate,
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        reviewedBy: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

    const reports = await this.enrichReportsWithLiveTasks(rawReports);

    const reportMap = new Map<string, any>();
    for (const r of reports) {
      reportMap.set(r.userId, r);
    }

    const memberReports = members.map((m) => {
      const rep = reportMap.get(m.userId);
      return {
        user: m.user,
        report: rep || null,
        isSubmitted: Boolean(rep && rep.status !== 'DRAFT'),
      };
    });

    return {
      reportDate,
      departmentId: targetDeptId,
      totalMembers: members.length,
      submittedCount: memberReports.filter((mr) => mr.isSubmitted).length,
      memberReports,
    };
  }

  /**
   * 5. Tổng hợp tự động số liệu của phòng ban (hỗ trợ Leader gom báo cáo)
   */
  async getDepartmentSummary(actor: AuthenticatedUser, departmentId?: string, dateStr?: string) {
    const reportDate = dateStr || getTodayString();
    let targetDeptId = departmentId;

    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );

    if (!isGlobalAdmin) {
      const leaderDeptIds = await this.getLeaderDepartmentIds(actor);
      if (leaderDeptIds.length === 0) {
        throw new ForbiddenException('Bạn không có quyền quản lý phòng ban nào');
      }

      if (targetDeptId) {
        if (!leaderDeptIds.includes(targetDeptId)) {
          throw new ForbiddenException('Bạn chỉ có thể xem tổng hợp báo cáo của phòng ban mình phụ trách');
        }
      } else {
        targetDeptId = leaderDeptIds[0];
      }
    } else {
      if (!targetDeptId) {
        targetDeptId = (await this.getUserDepartmentId(actor.userId)) || undefined;
      }
    }

    const isAccountant = this.scopes.isAccountant(actor) && !this.scopes.isGlobalAdmin(actor) && !actor.roles.includes('ADMIN');
    if (isAccountant) {
      const myDeptId = (await this.getUserDepartmentId(actor.userId)) || undefined;
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const allowedDepts = new Set<string>();
      if (myDeptId) allowedDepts.add(myDeptId);
      ledDepts.forEach((id) => allowedDepts.add(id));

      if (targetDeptId && !allowedDepts.has(targetDeptId)) {
        throw new ForbiddenException('Kế toán không được xem báo cáo của phòng ban khác');
      }
      if (!targetDeptId) {
        targetDeptId = myDeptId || Array.from(allowedDepts)[0];
      }
    }

    if (!targetDeptId) {
      throw new BadRequestException('Không tìm thấy phòng ban');
    }

    const reports = await this.prisma.dailyReport.findMany({
      where: {
        departmentId: targetDeptId,
        reportDate,
        status: { in: ['SUBMITTED', 'REVIEWED'] },
      },
      include: {
        user: { select: { profile: { select: { fullName: true } } } },
      },
    });

    // Tổng hợp các chỉ số
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalNewCustomers = 0;
    const completedTaskTitles: string[] = [];
    const inProgressTaskTitles: string[] = [];
    const obstaclesList: { userName: string; text: string }[] = [];

    for (const r of reports) {
      const uName = r.user?.profile?.fullName || 'Nhân sự';
      const metrics = (r.metrics as any[]) || [];

      for (const m of metrics) {
        const name = (m.name || '').toLowerCase();
        const rawVal = m.value;
        const numVal = typeof rawVal === 'number' ? rawVal : Number(String(rawVal || '').replace(/[^0-9.-]+/g, '')) || 0;

        if (name.includes('doanh số') || name.includes('doanh thu') || name.includes('tiền')) {
          totalRevenue += numVal;
        } else if (name.includes('đơn') || name.includes('order')) {
          totalOrders += numVal;
        } else if (name.includes('khách') || name.includes('lead')) {
          totalNewCustomers += numVal;
        }
      }

      const completed = (r.completedTasks as any[]) || [];
      completed.forEach((t) => {
        if (t.title) completedTaskTitles.push(`${t.title} (${uName})`);
      });

      const inProgress = (r.inProgressTasks as any[]) || [];
      inProgress.forEach((t) => {
        if (t.title) inProgressTaskTitles.push(`${t.title} (${uName})`);
      });

      if (r.obstacles && r.obstacles.trim()) {
        obstaclesList.push({ userName: uName, text: r.obstacles.trim() });
      }
    }

    return {
      reportDate,
      departmentId: targetDeptId,
      submittedCount: reports.length,
      totalRevenue,
      totalOrders,
      totalNewCustomers,
      completedTaskTitles,
      inProgressTaskTitles,
      obstaclesList,
    };
  }

  /**
   * 6. Leader chuyển đổi Kế hoạch ngày mai của nhân viên thành Task
   */
  async convertTomorrowPlanToTasks(actor: AuthenticatedUser, reportId: string, dto: ConvertPlanToTasksDto) {
    if (!this.isValidUuid(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, profile: { select: { fullName: true } } } },
        department: { select: { id: true, name: true, leaderUserId: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    // Kiểm tra phân quyền: Chỉ Leader của phòng ban (hoặc Admin) mới được duyệt kế hoạch của nhân viên phòng ban đó
    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );

    if (!isGlobalAdmin) {
      const leaderDeptIds = await this.getLeaderDepartmentIds(actor);
      if (!report.departmentId || !leaderDeptIds.includes(report.departmentId)) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền duyệt kế hoạch công việc của nhân viên thuộc phòng ban mình phụ trách'
        );
      }
    }

    if (!dto.planItems || dto.planItems.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 đầu việc kế hoạch để tạo Task');
    }

    const dueDateStr = dto.dueDate
      ? (typeof dto.dueDate === 'string' && dto.dueDate.includes('T') ? dto.dueDate.split('T')[0] : dto.dueDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dueAt = new Date(`${dueDateStr}T23:59:59.999Z`);

    const createdTasks = [];
    for (const itemTitle of dto.planItems) {
      if (!itemTitle || !itemTitle.trim()) continue;

      const cleanTitle = itemTitle.trim();
      const planDesc = `Nhiệm vụ được tạo từ Kế hoạch ngày mai trong Báo cáo ngày ${report.reportDate}`;

      // 1. Chống tạo trùng lặp trong bảng Task khi Leader bấm duyệt nhiều lần
      const existingTask = await this.prisma.task.findFirst({
        where: {
          title: cleanTitle,
          description: planDesc,
          departmentContextId: report.departmentId,
          assignments: {
            some: {
              userId: report.userId,
            },
          },
        },
      });

      if (!existingTask) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const taskCode = `TSK-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

      const task = await this.prisma.task.create({
        data: {
          taskCode,
            title: cleanTitle,
            description: planDesc,
          departmentContextId: report.departmentId,
          createdByUserId: actor.userId,
            priority: "NORMAL",
            status: "NEW",
          dueAt,
          assignments: {
            create: [
              {
                userId: report.userId,
                assignedByUserId: actor.userId,
                  status: "NEW",
              },
            ],
          },
        },
      });
      createdTasks.push(task);
    }

      // 2. Đồng thời tạo WorkTask cho ngày mai để hiển thị ngay trong bảng báo cáo công việc Excel
      const existingWorkTasks = await this.prisma.workTask.findMany({
        where: {
          userId: report.userId,
          isDeleted: false,
          OR: [
            { reportDate: dueDateStr },
            { updates: { some: { reportDate: dueDateStr } } },
          ],
        },
      });
      const existingWorkTask = existingWorkTasks.find(
        (wt) => (wt.title || '').trim().toLowerCase() === cleanTitle.toLowerCase()
      );

      if (!existingWorkTask) {
        const wtCode = await this.generateTaskCode();
        await this.prisma.workTask.create({
          data: {
            taskCode: wtCode,
            reportDate: dueDateStr,
            userId: report.userId,
            createdByUserId: actor.userId,
            departmentId: report.departmentId,
            category: 'Theo kế hoạch',
            title: cleanTitle,
            description: planDesc,
            taskType: 'THEO_KE_HOACH',
            priority: 'MEDIUM',
            workStatus: 'NOT_STARTED',
            approvalStatus: 'PENDING',
            updates: {
              create: {
                reportedByUserId: actor.userId,
                reportDate: dueDateStr,
                progress: 0,
                workStatus: 'NOT_STARTED',
                notes: 'Leader đã duyệt từ Kế hoạch ngày mai',
                approvalStatus: 'PENDING',
                isDraft: true,
              },
            },
          },
        });
      }
    }

    if (createdTasks.length > 0) {
    // Thông báo cho nhân viên
    setImmediate(async () => {
      try {
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
              type: "TASK_ASSIGNED",
              title: "Nhiệm vụ mới cho ngày mai",
            body: `Leader đã duyệt kế hoạch và giao ${createdTasks.length} nhiệm vụ cho bạn.`,
            metadata: {
              reportId: report.id,
              tasksCount: createdTasks.length,
            },
          });
          if (payload) this.notifications.emitCreated(payload);
        });
      } catch (e) {
          console.error("[DailyReports] Failed to notify task conversion:", e);
      }
    });
    }
    return {
      success: true,
      createdTasksCount: createdTasks.length,
      tasks: createdTasks,
    };
  }

  /**
   * 7. Admin xem danh sách báo cáo toàn công ty / toàn miền (kèm bộ lọc)
   */
  async getAdminReports(
    actor: AuthenticatedUser,
    query: { date?: string; departmentId?: string; status?: string; page?: number; limit?: number; search?: string }
  ) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const isHr = await this.scopes.isHrActorAsync(actor);
    const isGlobalAdmin = this.scopes.isGlobalAdmin(actor);
    let visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);

    // HR chỉ xem báo cáo phòng ban của mình (trừ khi là Admin)
    if (isHr && !isGlobalAdmin) {
      const primaryId = await this.getUserDepartmentId(actor.userId);
      visibleDepts = primaryId ? [primaryId] : [];
    }

    const where: any = {};

    if (query.date) {
      where.reportDate = query.date;
    }

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { in: ['SUBMITTED', 'REVIEWED'] };
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    } else if (visibleDepts !== null) {
      where.departmentId = { in: visibleDepts };
    }

    if (query.search) {
      where.OR = [
        { user: { profile: { fullName: { contains: query.search, mode: 'insensitive' } } } },
        { user: { userCode: { contains: query.search, mode: 'insensitive' } } },
        { department: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        orderBy: [{ reportDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
          department: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.dailyReport.count({ where }),
    ]);

    const items = await this.enrichReportsWithLiveTasks(rawItems);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 8. Admin chấm điểm sao & nhận xét báo cáo (Single-Review Lock)
   */

  async reviewReportByUserAndDate(actor: AuthenticatedUser, dto: { userId: string; reportDate: string; rating: number; review?: string }) {
    const { userId, reportDate, rating, review } = dto;
    if (!userId || !reportDate) throw new BadRequestException('Thiếu userId hoặc reportDate');
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao');

    const isAdmin = actor.roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.includes('LEADER');
    const isSelf = actor.userId === userId;
    if (!isAdmin && !isLeader && !isSelf) {
      throw new ForbiddenException('Bạn không có quyền chấm điểm báo cáo này');
    }

    let report = await this.prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate } }
    });

    if (!report) {
      const member = await this.prisma.departmentMember.findFirst({
        where: { userId }
      });
      const deptId = member?.departmentId;
      report = await this.prisma.dailyReport.create({
        data: {
          userId,
          departmentId: deptId || '00000000-0000-0000-0000-000000000000',
          reportDate,
          status: 'REVIEWED',
          adminRating: ratingNum,
          adminReview: review || null,
          reviewedById: actor.userId,
          reviewedAt: new Date()
        }
      });
    } else {
      report = await this.prisma.dailyReport.update({
        where: { id: report.id },
        data: {
          adminRating: ratingNum,
          adminReview: review || null,
          reviewedById: actor.userId,
          reviewedAt: new Date(),
          status: 'REVIEWED'
        }
      });
    }

    // Cập nhật rating cho tất cả task và task update của ngày hôm đó
    if (isAdmin || isLeader) {
      await this.prisma.workTaskUpdate.updateMany({
        where: { reportDate, task: { userId } },
        data: {
          selfRating: ratingNum,
          approvalStatus: 'APPROVED',
          approvedByUserId: actor.userId,
          approvedAt: new Date(),
          approvalNote: review || null
        }
      });
      await this.prisma.workTask.updateMany({
        where: { reportDate, userId },
        data: {
          approvalStatus: 'APPROVED'
        }
      });
    } else {
      // Nhân viên tự chấm sao
      await this.prisma.workTaskUpdate.updateMany({
        where: { reportDate, task: { userId } },
        data: {
          selfRating: ratingNum
        }
      });
    }

    return { ok: true, data: report };
  }

  async reviewReportByAdmin(actor: AuthenticatedUser, reportId: string, dto: ReviewDailyReportDto) {
    if (!this.isValidUuid(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, profile: { select: { fullName: true } } } },
        reviewedBy: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );
    if (!isGlobalAdmin) {
      const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null && !visibleDepts.includes(report.departmentId)) {
        throw new ForbiddenException('Bạn chỉ có quyền đánh giá báo cáo thuộc phòng ban mình phụ trách');
      }
    }

    // Cơ chế khóa 1 người duyệt (Single-Review Lock)
    // Người đánh giá ban đầu có thể cập nhật, HOẶC Quản trị viên cấp cao (ADMIN, SUPER_ADMIN) có quyền ghi đè
    if (report.reviewedById && report.reviewedById !== actor.userId && !isGlobalAdmin) {
      const reviewerName = report.reviewedBy?.profile?.fullName || 'Quản lý khác';
      throw new ForbiddenException(
        `Báo cáo này đã được ${reviewerName} đánh giá trước đó, bạn không thể thay đổi.`
      );
    }

    const updated = await this.prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        adminRating: dto.adminRating,
        adminReview: dto.adminReview || null,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
        status: 'REVIEWED',
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    // Gửi thông báo đến nhân sự
    setImmediate(async () => {
      try {
        const adminName = updated.reviewedBy?.profile?.fullName || 'Quản lý / Admin';
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
            type: 'TASK_UPDATED',
            title: `Báo cáo ngày ${report.reportDate} đã được đánh giá`,
            body: `${adminName} đã đánh giá ${dto.adminRating}/5 sao: "${dto.adminReview || 'Đã duyệt'}"`,
            metadata: {
              reportId: report.id,
              reportDate: report.reportDate,
              userId: report.userId,
              adminRating: dto.adminRating,
              adminReview: dto.adminReview,
              reviewedById: actor.userId,
              category: 'DAILY_REPORT',
              type: 'DAILY_REPORT_REVIEWED',
            },
          });
          if (payload) this.notifications.emitCreated(payload);
        });
      } catch (e) {
        console.error('[DailyReports] Failed to notify review result:', e);
      }
    });

    return updated;
  }

  /**
   * Leader / Admin: Yêu cầu nhân viên làm lại báo cáo (Bắt làm lại)
   */
  async requestReportRevision(actor: AuthenticatedUser, dto: { userId: string; reportDate: string; reason?: string }) {
    const { userId, reportDate, reason } = dto;
    if (!userId || !reportDate) throw new BadRequestException('Thiếu userId hoặc reportDate');

    const isAdmin = actor.roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.includes('LEADER');
    if (!isAdmin && !isLeader) {
      throw new ForbiddenException('Chỉ Leader hoặc Admin mới có quyền yêu cầu làm lại báo cáo');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate } }
    });

    const revisionNote = reason || 'Trưởng phòng / Admin yêu cầu làm lại báo cáo';

    if (report) {
      await this.prisma.dailyReport.update({
        where: { id: report.id },
        data: {
          status: 'DRAFT',
          adminReview: `[Yêu cầu làm lại]: ${revisionNote}`,
          reviewedById: actor.userId,
          reviewedAt: new Date()
        }
      });
    }

    await this.prisma.workTaskUpdate.updateMany({
      where: { reportDate, task: { userId } },
      data: {
        approvalStatus: 'NEED_MORE_INFO',
        approvalNote: revisionNote,
        approvedByUserId: actor.userId,
        approvedAt: new Date(),
        isDraft: true
      }
    });

    await this.prisma.workTask.updateMany({
      where: { reportDate, userId },
      data: {
        approvalStatus: 'NEED_MORE_INFO'
      }
    });

    try {
      const notif = await this.notifications.createForUsers(this.prisma, [userId], {
        type: NotificationType.TASK_UPDATED,
        title: 'Yêu cầu làm lại báo cáo ngày',
        body: `Báo cáo ngày ${reportDate} cần được chỉnh sửa và nộp lại. Lý do: ${revisionNote}`,
        metadata: {
          action: 'REVISION_REQUIRED',
          reportDate,
          reason: revisionNote,
          requestedByRole: isAdmin ? 'ADMIN' : 'LEADER'
        }
      });
      if (notif) this.notifications.emitCreated(notif);

      this.realtime.emitToUser(userId, 'daily-report:revision_required', {
        reportDate,
        reason: revisionNote,
        requestedByRole: isAdmin ? 'ADMIN' : 'LEADER'
      });
    } catch (err) {}

    return { ok: true, message: 'Đã gửi yêu cầu làm lại báo cáo thành công' };
  }

  /**
   * Leader / Admin: Xóa toàn bộ nhiệm vụ cả ngày của một nhân sự
   */
  async deleteUserDayTasks(actor: AuthenticatedUser, dto: { userId: string; date: string; reason?: string }) {
    const { userId, date, reason } = dto;
    if (!userId || !date) throw new BadRequestException('Thiếu userId hoặc date');

    const isAdmin = actor.roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.includes('LEADER');
    if (!isAdmin && !isLeader) {
      throw new ForbiddenException('Chỉ Leader hoặc Admin mới có quyền xóa nhiệm vụ ngày');
    }

    const deleteReason = reason || 'Leader / Admin xóa toàn bộ nhiệm vụ ngày';

    await this.prisma.workTask.updateMany({
      where: { userId, reportDate: date, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: actor.userId,
        deleteReason
      }
    });

    await this.prisma.dailyReport.updateMany({
      where: { userId, reportDate: date },
      data: {
        status: 'DRAFT',
        adminReview: `[Xóa nhiệm vụ ngày]: ${deleteReason}`
      }
    });

    return { ok: true, message: 'Đã xóa toàn bộ nhiệm vụ của ngày thành công' };
  }

  /**
   * Admin / Leader từ chối toàn bộ báo cáo ngày của nhân sự
   */
  async rejectReport(actor: AuthenticatedUser, reportId: string, dto: { reason: string }) {
    if (!this.isValidUuid(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối báo cáo');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, profile: { select: { fullName: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );
    if (!isGlobalAdmin) {
      const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null && !visibleDepts.includes(report.departmentId)) {
        throw new ForbiddenException('Bạn chỉ có quyền từ chối báo cáo thuộc phòng ban mình phụ trách');
      }
    }

    // Cập nhật trạng thái báo cáo thành REJECTED
    const updated = await this.prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        adminReview: reason,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    // Đồng bộ chuyển tất cả tasks trong ngày của nhân viên này sang REJECTED để mở khóa cho nhân viên sửa lại trên Web
    try {
      const tasks = await this.prisma.workTask.findMany({
        where: {
          userId: report.userId,
          reportDate: report.reportDate,
          isDeleted: false,
        },
        include: { updates: { where: { reportDate: report.reportDate } } },
      });

      for (const t of tasks) {
        await this.prisma.workTask.update({
          where: { id: t.id },
          data: { approvalStatus: 'REJECTED' },
        });

        if (t.updates && t.updates.length > 0) {
          for (const u of t.updates) {
            await this.prisma.workTaskUpdate.update({
              where: { id: u.id },
              data: {
                approvalStatus: 'REJECTED',
                approvalNote: reason,
                approvedByUserId: actor.userId,
                approvedAt: new Date(),
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn('[rejectReport] Error cascading task rejection:', e);
    }

    // Emit realtime event
    this.realtime.emitToDepartment(report.departmentId, 'daily_report:rejected', {
      reportId: report.id,
      userId: report.userId,
      reportDate: report.reportDate,
      reason,
      rejectedBy: updated.reviewedBy?.profile?.fullName || 'Quản lý',
    });

    // Gửi thông báo đến nhân sự
    setImmediate(async () => {
      try {
        const reviewerName = updated.reviewedBy?.profile?.fullName || 'Quản lý';
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
            type: 'TASK_UPDATED',
            title: `Báo cáo ngày ${report.reportDate} bị từ chối`,
            body: `${reviewerName} đã từ chối báo cáo: "${reason}". Vui lòng chỉnh sửa lại nội dung và nộp lại.`,
            metadata: {
              reportId: report.id,
              reportDate: report.reportDate,
              userId: report.userId,
              reason,
              category: 'DAILY_REPORT',
              type: 'DAILY_REPORT_REJECTED',
            },
          });
          if (payload) this.notifications.emitCreated(payload);
        });
      } catch (err) {
        console.error('[rejectReport] Failed to notify rejection:', err);
      }
    });

    return updated;
  }

  /**
   * Admin / Leader từ chối một nhiệm vụ cụ thể trong báo cáo ngày
   */
  async rejectTaskInReport(actor: AuthenticatedUser, reportId: string, dto: { taskId?: string; taskTitle?: string; reason: string }) {
    if (!this.isValidUuid(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, profile: { select: { fullName: true } } } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');

    const isGlobalAdmin = actor.roles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r)
    );
    if (!isGlobalAdmin) {
      const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);
      if (visibleDepts !== null && !visibleDepts.includes(report.departmentId)) {
        throw new ForbiddenException('Bạn chỉ có quyền từ chối báo cáo thuộc phòng ban mình phụ trách');
      }
    }

    // 1. Cập nhật task trong WorkTask và WorkTaskUpdate nếu có taskId hoặc tìm theo title
    let targetTaskId = dto.taskId;
    if (!targetTaskId && dto.taskTitle) {
      const matched = await this.prisma.workTask.findFirst({
        where: {
          userId: report.userId,
          reportDate: report.reportDate,
          title: dto.taskTitle,
          isDeleted: false,
        },
      });
      if (matched) targetTaskId = matched.id;
    }

    if (targetTaskId) {
      await this.prisma.workTask.update({
        where: { id: targetTaskId },
        data: { approvalStatus: 'REJECTED' },
      });

      const updates = await this.prisma.workTaskUpdate.findMany({
        where: { taskId: targetTaskId, reportDate: report.reportDate },
      });
      for (const u of updates) {
        await this.prisma.workTaskUpdate.update({
          where: { id: u.id },
          data: {
            approvalStatus: 'REJECTED',
            approvalNote: reason,
            approvedByUserId: actor.userId,
            approvedAt: new Date(),
          },
        });
      }
    }

    // 2. Cập nhật JSON bên trong DailyReport
    const updateItems = (list: any[]) => {
      if (!Array.isArray(list)) return list;
      return list.map((item) => {
        const matchId = targetTaskId && (item.taskId === targetTaskId || item.id === targetTaskId);
        const matchTitle = dto.taskTitle && (item.title === dto.taskTitle || item.name === dto.taskTitle);
        if (matchId || matchTitle) {
          return {
            ...item,
            approvalStatus: 'REJECTED',
            approvalNote: reason,
          };
        }
        return item;
      });
    };

    const newMetrics = updateItems(report.metrics as any[]);
    const newCompleted = updateItems(report.completedTasks as any[]);
    const newInProgress = updateItems(report.inProgressTasks as any[]);

    const updatedReport = await this.prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        metrics: newMetrics,
        completedTasks: newCompleted,
        inProgressTasks: newInProgress,
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    // Realtime notification
    this.realtime.emitToDepartment(report.departmentId, 'work-report:department_updated', {
      departmentId: report.departmentId,
      action: 'TASK_REJECTED',
      reportDate: report.reportDate,
    });

    const actorUser = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { profile: { select: { fullName: true } } },
    });
    const reviewerName = actorUser?.profile?.fullName || 'Quản lý';

    setImmediate(async () => {
      try {
        const itemTitle = dto.taskTitle || 'Nhiệm vụ';
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
            type: 'TASK_UPDATED',
            title: `Nhiệm vụ bị từ chối: "${itemTitle}"`,
            body: `${reviewerName} đã từ chối: "${reason}". Vui lòng chỉnh sửa lại.`,
            metadata: {
              reportId: report.id,
              reportDate: report.reportDate,
              taskId: targetTaskId,
              taskTitle: itemTitle,
              reason,
              category: 'WORK_TASK',
              type: 'TASK_REJECTED',
            },
          });
          if (payload) this.notifications.emitCreated(payload);
        });
      } catch (err) {
        console.error('[rejectTaskInReport] Failed to notify:', err);
      }
    });

    return updatedReport;
  }

  /**
   * 9. Lấy chi tiết một báo cáo theo ID (chính chủ, leader phòng hoặc admin)
   */
  async getReportById(actor: AuthenticatedUser, reportId: string) {
    if (!this.isValidUuid(reportId)) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    const isOwner = report.userId === actor.userId;
    const isAdmin = actor.roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'HR'].includes(r));
    const isLeader = actor.roles.includes('LEADER');

    if (!isOwner && !isAdmin && !isLeader) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo này');
    }

    const [enriched] = await this.enrichReportsWithLiveTasks([report]);
    return enriched;
  }

  // ─── Work Tasks Integration (Merged from WorkReports) ───────────────────────

  private getVietnamNow(): Date {
    const now = new Date();
    return new Date(now.getTime() + 7 * 60 * 60 * 1000);
  }

  private getTodayVN(): string {
    return this.getVietnamNow().toISOString().split('T')[0];
  }

  private isInReportingWindow(): boolean {
    const vnTime = this.getVietnamNow();
    const hour = vnTime.getUTCHours();
    const minute = vnTime.getUTCMinutes();
    const totalMinutes = hour * 60 + minute;
    return totalMinutes >= 15 * 60 && totalMinutes < 19 * 60;
  }

  private async logHistory(data: {
    taskId?: string;
    updateId?: string;
    actorUserId: string;
    action: string;
    fieldChanged?: string;
    beforeValue?: any;
    afterValue?: any;
    reason?: string;
  }) {
    await this.prisma.workReportHistory.create({
      data: {
        taskId: data.taskId,
        updateId: data.updateId,
        actorUserId: data.actorUserId,
        action: data.action,
        fieldChanged: data.fieldChanged,
        beforeValue: data.beforeValue ? data.beforeValue : undefined,
        afterValue: data.afterValue ? data.afterValue : undefined,
        reason: data.reason
      }
    });
  }

  private async getUserDeptId(userId: string): Promise<string | null> {
    return this.getUserDepartmentId(userId);
  }

  async upsertTaskFromReportItem(data: {
    taskId?: string;
    userId: string;
    departmentId: string;
    category: string;
    title: string;
    description?: string | null;
    taskType: string;
    priority: string;
    deadline?: string | null;
    workStatus: string;
    progress: number;
    notes?: string | null;
    obstacles?: string | null;
    supportRequest?: string | null;
    selfRating?: number | null;
    attachments?: any;
    reportDate: string;
    isDraft?: boolean;
    metricName?: string;
  }) {
    try {
      let task: any = null;
      if (data.taskId) {
        task = await this.prisma.workTask.findUnique({ where: { id: data.taskId } });
      }
      if (!task) {
        task = await this.prisma.workTask.findFirst({
          where: {
            userId: data.userId,
            reportDate: data.reportDate,
            OR: [
              { title: data.title },
              ...(data.metricName ? [{ title: { startsWith: data.metricName } }] : []),
            ],
            isDeleted: false,
          }
        });
      }

      if (task) {
        const taskUpdateData: any = {
          title: data.title,
          category: data.category || task.category,
          description: data.description !== undefined ? data.description : task.description,
          taskType: data.taskType || task.taskType,
          priority: data.priority || task.priority,
          deadline: data.deadline !== undefined ? data.deadline : task.deadline,
          workStatus: data.workStatus || task.workStatus,
        };
        if (data.selfRating !== undefined && data.selfRating !== null) taskUpdateData.selfRating = data.selfRating;
        if (data.attachments !== undefined) taskUpdateData.attachments = data.attachments;

        await this.prisma.workTask.update({
          where: { id: task.id },
          data: taskUpdateData
        });

        const existingUpdate = await this.prisma.workTaskUpdate.findUnique({
          where: { taskId_reportDate: { taskId: task.id, reportDate: data.reportDate } }
        });
        if (existingUpdate) {
          await this.prisma.workTaskUpdate.update({
            where: { id: existingUpdate.id },
            data: {
              progress: data.progress,
              workStatus: data.workStatus,
              notes: data.notes || existingUpdate.notes,
              obstacles: data.obstacles || existingUpdate.obstacles,
              supportRequest: data.supportRequest || existingUpdate.supportRequest,
              selfRating: data.selfRating !== undefined && data.selfRating !== null ? data.selfRating : existingUpdate.selfRating,
              attachments: data.attachments !== undefined ? data.attachments : existingUpdate.attachments,
              isDraft: data.isDraft ?? existingUpdate.isDraft,
            }
          });
        } else {
          await this.prisma.workTaskUpdate.create({
            data: {
              taskId: task.id,
              reportDate: data.reportDate,
              progress: data.progress,
              workStatus: data.workStatus,
              notes: data.notes,
              obstacles: data.obstacles,
              supportRequest: data.supportRequest,
              selfRating: data.selfRating ?? 5,
              attachments: data.attachments || [],
              reportedByUserId: data.userId,
              isDraft: data.isDraft ?? false,
            }
          });
        }
      } else {
        const taskCode = await this.generateTaskCode();
        task = await this.prisma.workTask.create({
          data: {
            taskCode,
            userId: data.userId,
            createdByUserId: data.userId,
            departmentId: data.departmentId,
            category: data.category || 'Vận hành',
            title: data.title,
            description: data.description || null,
            taskType: data.taskType || 'THEO_KE_HOACH',
            priority: data.priority || 'MEDIUM',
            deadline: data.deadline || null,
            workStatus: data.workStatus || 'IN_PROGRESS',
            approvalStatus: 'PENDING',
            selfRating: data.selfRating ?? 5,
            attachments: data.attachments || [],
            reportDate: data.reportDate,
            updates: {
              create: {
                reportDate: data.reportDate,
                progress: data.progress,
                workStatus: data.workStatus || 'IN_PROGRESS',
                approvalStatus: 'PENDING',
                notes: data.notes || null,
                obstacles: data.obstacles || null,
                supportRequest: data.supportRequest || null,
                selfRating: data.selfRating ?? 5,
                attachments: data.attachments || [],
                reportedByUserId: data.userId,
                isDraft: data.isDraft ?? false,
              }
            }
          }
        });
      }
      return task;
    } catch (err) {
      console.error('[DailyReportsService] upsertTaskFromReportItem error:', err);
      return null;
    }
  }

  async syncDailyReportsToTasks(departmentId?: string, dateStr?: string, specificUserId?: string) {
    try {
      const date = dateStr || this.getTodayVN();
      const whereReport: any = { reportDate: date };
      if (specificUserId) {
        whereReport.userId = specificUserId;
      } else if (departmentId && departmentId !== 'ALL') {
        whereReport.departmentId = departmentId;
      }

      const dailyReports = await this.prisma.dailyReport.findMany({
        where: whereReport,
      });

      for (const r of dailyReports) {
        const userId = r.userId;
        const deptId = r.departmentId || await this.getUserDeptId(userId);
        if (!deptId) continue;
        const isDraft = r.status === 'DRAFT';

        // 1. Sync completedTasks
        const completed = Array.isArray(r.completedTasks) ? r.completedTasks : [];
        for (const t of completed as any[]) {
          if (!t || !t.title || t.isSelected === false) continue;
          await this.upsertTaskFromReportItem({
            taskId: t.taskId,
            userId,
            departmentId: deptId,
            category: t.category || 'Vận hành',
            title: t.title,
            description: t.description || null,
            taskType: t.taskType || 'THEO_KE_HOACH',
            priority: t.priority || 'MEDIUM',
            deadline: t.deadline || null,
            workStatus: 'DONE',
            progress: 100,
            notes: t.notes || t.note || null,
            obstacles: t.obstacles || null,
            supportRequest: t.supportRequest || null,
            selfRating: t.selfRating ?? r.selfRating ?? 5,
            attachments: t.attachments || [],
            reportDate: date,
            isDraft,
          });
        }

        // 2. Sync inProgressTasks
        const inProgress = Array.isArray(r.inProgressTasks) ? r.inProgressTasks : [];
        for (const t of inProgress as any[]) {
          if (!t || !t.title) continue;
          await this.upsertTaskFromReportItem({
            taskId: t.taskId,
            userId,
            departmentId: deptId,
            category: t.category || 'Vận hành',
            title: t.title,
            description: t.description || null,
            taskType: t.taskType || 'THEO_KE_HOACH',
            priority: t.priority || 'MEDIUM',
            deadline: t.deadline || null,
            workStatus: t.status || 'IN_PROGRESS',
            progress: t.progress ?? 50,
            notes: t.notes || t.note || null,
            obstacles: t.obstacles || null,
            supportRequest: t.supportRequest || null,
            selfRating: t.selfRating ?? r.selfRating ?? 5,
            attachments: t.attachments || [],
            reportDate: date,
            isDraft,
          });
        }

        // 3. Sync metrics
        const metrics = Array.isArray(r.metrics) ? r.metrics : [];
        for (const m of metrics as any[]) {
          if (!m || !m.name) continue;
          const status = m.status === 'DONE' ? 'DONE' : 'IN_PROGRESS';
          const progress = status === 'DONE' ? 100 : (m.progress ?? 50);
          await this.upsertTaskFromReportItem({
            userId,
            departmentId: deptId,
            category: m.category || 'Vận hành',
            title: m.name + (m.value !== undefined ? `: ${m.value} ${m.unit || ''}` : ''),
            description: m.description || null,
            taskType: m.taskType || 'THEO_KE_HOACH',
            priority: m.priority || 'MEDIUM',
            deadline: m.deadline || null,
            workStatus: status,
            progress,
            notes: m.notes || m.note || null,
            obstacles: m.obstacles || null,
            supportRequest: m.supportRequest || null,
            selfRating: r.selfRating ?? 5,
            attachments: [],
            reportDate: date,
            isDraft,
            metricName: m.name,
          });
        }
      }
    } catch (err) {
      console.error('[DailyReportsService] syncDailyReportsToTasks error:', err);
    }
  }

  async getMyTasks(actor: AuthenticatedUser, query: QueryWorkTasksDto) {
    const userId = actor.userId;
    const date = query.date || this.getTodayVN();
    await this.syncDailyReportsToTasks(undefined, date, actor.userId);
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDeleted: false,
      OR: [
        { reportDate: date },
        { updates: { some: { reportDate: date } } },
        { 
           isCarriedOver: true,
           workStatus: { notIn: ['DONE', 'CANCELLED'] },
           createdAt: { lte: new Date(`${date}T23:59:59.999Z`) } 
        }
      ]
    };

    if (query.workStatus && query.workStatus !== 'ALL') {
      where.workStatus = query.workStatus;
    }
    if (query.approvalStatus && query.approvalStatus !== 'ALL') {
      where.approvalStatus = query.approvalStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.workTask.findMany({
        where,
        include: {
          user: { 
            select: { 
              id: true, 
              userCode: true, 
              profile: { select: { fullName: true, avatarUrl: true } },
              roles: { select: { role: { select: { code: true } } } }
            } 
          },
          department: { select: { id: true, name: true, code: true, leaderUserId: true } },
          updates: {
            where: { reportDate: date },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.workTask.count({ where })
    ]);

    const formattedItems = items.map(t => {
      const isLeader = t.department?.leaderUserId === t.userId || 
        t.user?.roles?.some((r: any) => ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(r.role?.code));
      return {
        ...t,
        isLeader: Boolean(isLeader),
        latestUpdate: t.updates[0] || null
      };
    });

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createTask(actor: AuthenticatedUser, dto: CreateWorkTaskDto) {
    const userId = dto.proxyForUserId || actor.userId;
    const isProxy = !!dto.proxyForUserId && dto.proxyForUserId !== actor.userId;
    const date = dto.reportDate || this.getTodayVN();

    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    if (!isAdmin && !this.isInReportingWindow() && !dto.isTestBypass) {
      if (!dto.isMakeup) {
        throw new ForbiddenException('Chỉ được tạo/báo cáo công việc trong khung giờ 15:00 - 19:00');
      }
    }

    if (isProxy && !actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r)) && !isAdmin) {
      throw new ForbiddenException('Chỉ Leader/HR/Admin mới được nhập báo cáo thay');
    }

    const departmentId = await this.getUserDeptId(userId);
    if (!departmentId) throw new BadRequestException('Không tìm thấy phòng ban');

    const taskCode = await this.generateTaskCode();
    const workStatus = (dto.initialProgress === 100) ? 'DONE' : 'IN_PROGRESS';
    const progress = (dto.initialProgress === 100) ? 100 : (dto.initialProgress || 0);

    const task = await this.prisma.workTask.create({
      data: {
        taskCode,
        userId,
        createdByUserId: actor.userId,
        departmentId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        taskType: dto.taskType || 'REGULAR',
        priority: dto.priority || 'MEDIUM',
        deadline: dto.deadline,
        workStatus,
        selfRating: dto.selfRating ?? 5,
        attachments: dto.attachments || [],
        isMakeup: dto.isMakeup || false,
        makeupForDate: dto.makeupForDate,
        makeupReason: dto.makeupReason,
        reportDate: date,
        updates: {
          create: {
            reportDate: date,
            progress,
            workStatus,
            notes: dto.initialNotes,
            obstacles: dto.initialObstacles,
            supportRequest: dto.initialSupportRequest,
            selfRating: dto.selfRating ?? 5,
            attachments: dto.attachments || [],
            reportedByUserId: actor.userId,
            isProxied: isProxy,
            proxyReason: isProxy ? 'Leader nhập thay' : null,
            isDraft: false
          }
        }
      },
      include: {
        updates: true
      }
    });

    await this.logHistory({
      taskId: task.id,
      actorUserId: actor.userId,
      action: isProxy ? 'PROXY_CREATE' : 'CREATE',
      reason: dto.makeupReason || 'Tạo mới'
    });

    return task;
  }

  async addWorkTaskUpdate(actor: AuthenticatedUser, taskId: string, dto: CreateWorkTaskUpdateDto) {
    if (!this.isValidUuid(taskId)) {
      throw new NotFoundException('Không tìm thấy công việc');
    }
    const date = dto.reportDate || this.getTodayVN();
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');

    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isOwner = task.userId === actor.userId;
    const isLeader = actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r));

    if (!isAdmin && !isLeader && !this.isInReportingWindow() && !dto.isTestBypass) {
      if (!dto.isDraft) {
         throw new ForbiddenException('Chỉ được báo cáo công việc trong khung giờ 15:00 - 19:00');
      }
    }

    if (!isOwner && !isLeader && !isAdmin) {
      throw new ForbiddenException('Không có quyền cập nhật');
    }

    const isProxy = !isOwner;
    let workStatus = dto.workStatus || task.workStatus;
    
    if (task.workStatus === 'DONE' && workStatus !== 'DONE' && !isLeader && !isAdmin && task.approvalStatus !== 'NEED_MORE_INFO') {
      throw new ForbiddenException('Nhân viên không được tự mở lại công việc đã hoàn thành');
    }
    
    if (dto.progress === 100 || workStatus === 'DONE') {
      workStatus = 'DONE';
    }
    const progress = workStatus === 'DONE' ? 100 : (dto.progress ?? 0);

    let update = await this.prisma.workTaskUpdate.findUnique({
      where: { taskId_reportDate: { taskId, reportDate: date } }
    });

    if (update) {
      update = await this.prisma.workTaskUpdate.update({
        where: { id: update.id },
        data: {
          progress,
          workStatus,
          approvalStatus: 'PENDING',
          approvedByUserId: null,
          approvedAt: null,
          approvalNote: null,
          notes: dto.notes,
          obstacles: dto.obstacles,
          supportRequest: dto.supportRequest,
          selfRating: dto.selfRating !== undefined ? dto.selfRating : undefined,
          attachments: dto.attachments !== undefined ? dto.attachments : undefined,
          isDraft: dto.isDraft || false,
          reportedByUserId: actor.userId,
          isProxied: isProxy,
          proxyReason: dto.proxyReason
        }
      });
    } else {
      update = await this.prisma.workTaskUpdate.create({
        data: {
          taskId,
          reportDate: date,
          progress,
          workStatus,
          approvalStatus: 'PENDING',
          notes: dto.notes,
          obstacles: dto.obstacles,
          supportRequest: dto.supportRequest,
          selfRating: dto.selfRating ?? 5,
          attachments: dto.attachments || [],
          isDraft: dto.isDraft || false,
          reportedByUserId: actor.userId,
          isProxied: isProxy,
          proxyReason: dto.proxyReason
        }
      });
    }

    const taskUpdateData: any = { workStatus, approvalStatus: 'PENDING' };
    if (dto.selfRating !== undefined) taskUpdateData.selfRating = dto.selfRating;
    if (dto.attachments !== undefined) taskUpdateData.attachments = dto.attachments;

    await this.prisma.workTask.update({
      where: { id: taskId },
      data: taskUpdateData
    });

    await this.logHistory({
      taskId,
      updateId: update.id,
      actorUserId: actor.userId,
      action: 'UPDATE_PROGRESS',
      afterValue: { progress, workStatus }
    });

    return update;
  }

  async getTaskDetail(actor: AuthenticatedUser, taskId: string) {
    if (!this.isValidUuid(taskId)) {
      throw new NotFoundException('Không tìm thấy công việc');
    }
    const task = await this.prisma.workTask.findUnique({
      where: { id: taskId },
      include: {
        updates: {
          orderBy: { reportDate: 'desc' },
          include: {
            reportedBy: { select: { profile: { select: { fullName: true } } } },
            approvedBy: { select: { profile: { select: { fullName: true } } } }
          }
        },
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
        department: { select: { id: true, name: true } }
      }
    });

    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    return task;
  }

  async getDepartmentTasks(actor: AuthenticatedUser, query: QueryWorkTasksDto) {
    let departmentId: string | null | undefined = query.departmentId;
    if (departmentId === 'ALL') departmentId = undefined;

    const date = query.date || this.getTodayVN();
    await this.syncDailyReportsToTasks(departmentId, date);
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      OR: [
        { reportDate: date },
        { updates: { some: { reportDate: date } } },
        { 
           isCarriedOver: true,
           workStatus: { notIn: ['DONE', 'CANCELLED'] },
           createdAt: { lte: new Date(`${date}T23:59:59.999Z`) } 
        }
      ]
    };

    const isHr = await this.scopes.isHrActorAsync(actor);
    const isGlobalAdmin = this.scopes.isGlobalAdmin(actor);
    const isAccountant = this.scopes.isAccountant(actor) && !isGlobalAdmin && !actor.roles.includes('ADMIN');
    let visibleDepts: string[] | null = await this.scopes.getVisibleDepartmentIds(actor);

    if (isAccountant) {
      const myDeptId = await this.getUserDeptId(actor.userId);
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const deptSet = new Set<string>();
      if (myDeptId) deptSet.add(myDeptId);
      ledDepts.forEach((id) => deptSet.add(id));
      visibleDepts = Array.from(deptSet);
    } else if (isHr && !isGlobalAdmin) {
      const primaryId = await this.getUserDeptId(actor.userId);
      visibleDepts = primaryId ? [primaryId] : [];
    }
    if (visibleDepts !== null) {
      if (departmentId) {
        if (!visibleDepts.includes(departmentId)) {
          return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };
        }
        where.departmentId = departmentId;
      } else {
        where.departmentId = { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] };
      }
    } else {
      if (departmentId) where.departmentId = departmentId;
    }

    if (query.userId) where.userId = query.userId;
    if (query.workStatus && query.workStatus !== 'ALL') where.workStatus = query.workStatus;
    if (query.approvalStatus && query.approvalStatus !== 'ALL') where.approvalStatus = query.approvalStatus;

    if (query.search) {
      const searchOR = [
        { taskCode: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { user: { profile: { fullName: { contains: query.search, mode: 'insensitive' } } } }
      ];
      where.AND = [
        { OR: where.OR },
        { OR: searchOR }
      ];
      delete where.OR;
    }

    const [items, total] = await Promise.all([
      this.prisma.workTask.findMany({
        where,
        include: {
          user: { 
            select: { 
              id: true, 
              userCode: true, 
              profile: { select: { fullName: true, avatarUrl: true } },
              roles: { select: { role: { select: { code: true } } } }
            } 
          },
          department: { select: { id: true, name: true, code: true, leaderUserId: true } },
          updates: {
            where: { reportDate: date },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [{ departmentId: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      }),
      this.prisma.workTask.count({ where })
    ]);

    const formattedItems = items.map(t => {
      const isLeader = t.department?.leaderUserId === t.userId || 
        t.user?.roles?.some((r: any) => ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(r.role?.code));
      return {
        ...t,
        isLeader: Boolean(isLeader),
        latestUpdate: t.updates[0] || null
      };
    });

    return {
      items: formattedItems,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getSubmissionStatus(actor: AuthenticatedUser, query: { departmentId?: string; date?: string }) {
    let departmentId: string | null | undefined = query.departmentId;
    if (departmentId === 'ALL') departmentId = undefined;

    const isHr = await this.scopes.isHrActorAsync(actor);
    const isGlobalAdmin = this.scopes.isGlobalAdmin(actor);
    const isAccountant = this.scopes.isAccountant(actor) && !isGlobalAdmin && !actor.roles.includes('ADMIN');
    let visibleDepts: string[] | null = await this.scopes.getVisibleDepartmentIds(actor);

    if (isAccountant) {
      const myDeptId = await this.getUserDeptId(actor.userId);
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const deptSet = new Set<string>();
      if (myDeptId) deptSet.add(myDeptId);
      ledDepts.forEach((id) => deptSet.add(id));
      visibleDepts = Array.from(deptSet);
    } else if (isHr && !isGlobalAdmin) {
      const primaryId = await this.getUserDeptId(actor.userId);
      visibleDepts = primaryId ? [primaryId] : [];
    }
    if (visibleDepts !== null) {
      if (departmentId) {
        if (!visibleDepts.includes(departmentId)) {
          throw new ForbiddenException('Bạn không có quyền xem tình hình nộp của phòng ban này');
        }
      } else {
        departmentId = visibleDepts[0];
      }
    } else if (!departmentId) {
      departmentId = await this.getUserDeptId(actor.userId);
    }

    if (!departmentId) throw new BadRequestException('Không tìm thấy phòng ban');
    const date = query.date || this.getTodayVN();

    const members = await this.prisma.departmentMember.findMany({
      where: { departmentId, leftAt: null },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } }
      }
    });

    const updates = await this.prisma.workTaskUpdate.findMany({
      where: {
        reportDate: date,
        task: { departmentId },
        isDraft: false
      },
      select: { reportedByUserId: true, taskId: true, task: { select: { userId: true } } }
    });

    const submittedUserIds = new Set(updates.map(u => u.task.userId));

    const dailySubmitted = await this.prisma.dailyReport.findMany({
      where: {
        departmentId,
        reportDate: date,
        status: { in: ['SUBMITTED', 'REVIEWED'] }
      },
      select: { userId: true }
    });
    for (const ds of dailySubmitted) {
      submittedUserIds.add(ds.userId);
    }

    const result = members.map(m => ({
      user: m.user,
      isSubmitted: submittedUserIds.has(m.userId)
    }));

    return {
      date,
      departmentId,
      total: members.length,
      submittedCount: submittedUserIds.size,
      members: result
    };
  }

  async approveTaskUpdate(actor: AuthenticatedUser, taskId: string, updateId: string, dto: ApproveWorkTaskUpdateDto) {
    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r));
    if (!isAdmin && !isLeader) {
      throw new ForbiddenException('Chỉ Quản trị viên (Admin) hoặc Quản lý mới có quyền duyệt báo cáo');
    }

    const update = await this.prisma.workTaskUpdate.findUnique({
      where: { id: updateId },
      include: { task: true }
    });
    if (!update || update.taskId !== taskId) throw new NotFoundException('Không tìm thấy bản cập nhật');

    if (!isAdmin && isLeader && update.task.departmentId) {
      const allowed = await this.scopes.canAccessDepartment(actor, update.task.departmentId);
      if (!allowed) {
        throw new ForbiddenException('Bạn không có quyền duyệt báo cáo của phòng ban này');
      }
    }

    const updated = await this.prisma.workTaskUpdate.update({
      where: { id: updateId },
      data: {
        approvalStatus: dto.approvalStatus,
        approvalNote: dto.approvalNote,
        approvedByUserId: actor.userId,
        approvedAt: new Date()
      }
    });

    await this.prisma.workTask.update({
      where: { id: taskId },
      data: { approvalStatus: dto.approvalStatus }
    });

    await this.logHistory({
      taskId,
      updateId,
      actorUserId: actor.userId,
      action: 'APPROVE',
      afterValue: { approvalStatus: dto.approvalStatus, approvalNote: dto.approvalNote }
    });

    const isApproved = dto.approvalStatus === 'APPROVED';
    const isNeedInfo = dto.approvalStatus === 'NEED_MORE_INFO';
    const isRejected = dto.approvalStatus === 'REJECTED';
    const action = isApproved ? 'APPROVED' : isNeedInfo ? 'NEED_MORE_INFO' : isRejected ? 'REJECTED' : 'UPDATED';

    const approverRoleName = isAdmin ? 'Quản trị viên' : 'Trưởng phòng';
    const title = isApproved
      ? 'Báo cáo công việc đã được phê duyệt'
      : isNeedInfo
      ? 'Yêu cầu bổ sung báo cáo công việc'
      : isRejected
      ? `${approverRoleName} từ chối báo cáo công việc`
      : 'Cập nhật trạng thái duyệt công việc';

    const body = isApproved
      ? `Công việc "${update.task.title}" (${update.task.taskCode}) đã được ${approverRoleName} phê duyệt hoàn tất.`
      : isNeedInfo
      ? `Công việc "${update.task.title}" (${update.task.taskCode}) có yêu cầu bổ sung: ${dto.approvalNote || 'Vui lòng kiểm tra lại nội dung.'}`
      : isRejected
      ? `Công việc "${update.task.title}" (${update.task.taskCode}) đã bị ${approverRoleName} từ chối: ${dto.approvalNote || 'Vui lòng kiểm tra và chỉnh sửa lại.'}`
      : `Công việc "${update.task.title}" (${update.task.taskCode}) được cập nhật trạng thái duyệt: ${dto.approvalStatus}.`;

    if (update.task.userId) {
      try {
        const notif = await this.notifications.createForUsers(this.prisma, [update.task.userId], {
          type: NotificationType.TASK_UPDATED,
          title,
          body,
          taskId: update.task.id,
          metadata: {
            taskId: update.task.id,
            taskCode: update.task.taskCode,
            action,
            approvalStatus: dto.approvalStatus,
            approvalNote: dto.approvalNote,
            rejectedByRole: isAdmin ? 'ADMIN' : 'LEADER',
            rejectedByName: (actor as any).fullName || approverRoleName
          }
        });
        if (notif) this.notifications.emitCreated(notif);

        this.realtime.emitToUser(update.task.userId, 'work-report:action', {
          taskId: update.task.id,
          taskCode: update.task.taskCode,
          action,
          approvalStatus: dto.approvalStatus,
          approvalNote: dto.approvalNote,
          title,
          body,
          rejectedByRole: isAdmin ? 'ADMIN' : 'LEADER'
        });
      } catch (err) {}
    }

    if (isRejected && isAdmin && update.task.departmentId) {
      try {
        const dept = await this.prisma.department.findUnique({
          where: { id: update.task.departmentId },
          select: { leaderUserId: true }
        });
        const leaderUserId = dept?.leaderUserId;
        if (leaderUserId && leaderUserId !== actor.userId && leaderUserId !== update.task.userId) {
          const leaderTitle = 'Quản trị viên đã từ chối báo cáo của nhân viên';
          const leaderBody = `Công việc "${update.task.title}" (${update.task.taskCode}) của nhân viên đã bị Quản trị viên từ chối: ${dto.approvalNote || 'Vui lòng kiểm tra lại.'}`;

          const leaderNotif = await this.notifications.createForUsers(this.prisma, [leaderUserId], {
            type: NotificationType.TASK_UPDATED,
            title: leaderTitle,
            body: leaderBody,
            taskId: update.task.id,
            metadata: {
              taskId: update.task.id,
              taskCode: update.task.taskCode,
              action: 'REJECTED',
              approvalStatus: 'REJECTED',
              approvalNote: dto.approvalNote,
              rejectedByRole: 'ADMIN',
              targetEmployeeId: update.task.userId
            }
          });
          if (leaderNotif) this.notifications.emitCreated(leaderNotif);

          this.realtime.emitToUser(leaderUserId, 'work-report:action', {
            taskId: update.task.id,
            taskCode: update.task.taskCode,
            action: 'REJECTED',
            approvalStatus: 'REJECTED',
            approvalNote: dto.approvalNote,
            title: leaderTitle,
            body: leaderBody,
            rejectedByRole: 'ADMIN',
            targetEmployeeId: update.task.userId
          });
        }
      } catch (err) {}
    }

    if (update.task.departmentId) {
      this.realtime.emitToDepartment(update.task.departmentId, 'work-report:department_updated', {
        taskId: update.task.id,
        taskCode: update.task.taskCode,
        departmentId: update.task.departmentId,
        approvalStatus: dto.approvalStatus,
        action: isApproved ? 'APPROVED' : isNeedInfo ? 'NEED_MORE_INFO' : 'UPDATED'
      });
    }

    return updated;
  }

  async transferTask(actor: AuthenticatedUser, taskId: string, dto: TransferWorkTaskDto) {
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');

    const oldUserId = task.userId;
    const updated = await this.prisma.workTask.update({
      where: { id: taskId },
      data: { userId: dto.newUserId }
    });

    await this.logHistory({
      taskId,
      actorUserId: actor.userId,
      action: 'TRANSFER',
      beforeValue: { userId: oldUserId },
      afterValue: { userId: dto.newUserId },
      reason: dto.reason
    });

    try {
      if (dto.newUserId) {
        const notif = await this.notifications.createForUsers(this.prisma, [dto.newUserId], {
          type: NotificationType.TASK_ASSIGNED,
          title: 'Bạn được bàn giao công việc mới',
          body: `Công việc "${task.title}" (${task.taskCode}) đã được chuyển giao cho bạn. Lý do: ${dto.reason || 'Điều phối công việc'}`,
          taskId: task.id,
          metadata: { taskId: task.id, taskCode: task.taskCode, action: 'TRANSFER' }
        });
        if (notif) this.notifications.emitCreated(notif);

        this.realtime.emitToUser(dto.newUserId, 'work-report:action', {
          taskId: task.id,
          taskCode: task.taskCode,
          action: 'TRANSFER_IN',
          title: 'Bạn được bàn giao công việc mới',
          body: `Công việc "${task.title}" (${task.taskCode}) đã được chuyển giao cho bạn.`
        });
      }

      if (oldUserId && oldUserId !== dto.newUserId) {
        this.realtime.emitToUser(oldUserId, 'work-report:action', {
          taskId: task.id,
          taskCode: task.taskCode,
          action: 'TRANSFER_OUT',
          title: 'Công việc đã được chuyển giao',
          body: `Công việc "${task.title}" (${task.taskCode}) đã được bàn giao cho nhân sự khác.`
        });
      }

      if (task.departmentId) {
        this.realtime.emitToDepartment(task.departmentId, 'work-report:department_updated', {
          taskId: task.id,
          departmentId: task.departmentId,
          action: 'TRANSFER'
        });
      }
    } catch (err) {}

    return updated;
  }

  async adminGetAllTasks(actor: AuthenticatedUser, query: QueryWorkTasksDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    const date = query.date || this.getTodayVN();
    await this.syncDailyReportsToTasks(query.departmentId, date);

    if (query.date) {
      where.OR = [
        { reportDate: date },
        { updates: { some: { reportDate: date } } },
        { 
          isCarriedOver: true,
          workStatus: { notIn: ['DONE', 'CANCELLED'] },
          createdAt: { lte: new Date(`${date}T23:59:59.999Z`) } 
        }
      ];
    }

    const isHr = await this.scopes.isHrActorAsync(actor);
    const isGlobalAdmin = this.scopes.isGlobalAdmin(actor);
    let visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);

    if (isHr && !isGlobalAdmin) {
      const primaryId = await this.getUserDeptId(actor.userId);
      visibleDepts = primaryId ? [primaryId] : [];
    }
    if (visibleDepts !== null) {
      if (query.departmentId && query.departmentId !== 'ALL') {
        if (!visibleDepts.includes(query.departmentId)) {
          return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };
        }
        where.departmentId = query.departmentId;
      } else {
        where.departmentId = { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] };
      }
    } else {
      if (query.departmentId && query.departmentId !== 'ALL') {
        where.departmentId = query.departmentId;
      }
    }

    if (query.userId) where.userId = query.userId;
    if (query.workStatus && query.workStatus !== 'ALL') where.workStatus = query.workStatus;
    if (query.approvalStatus && query.approvalStatus !== 'ALL') where.approvalStatus = query.approvalStatus;

    if (query.search) {
      const searchOR = [
        { taskCode: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { user: { profile: { fullName: { contains: query.search, mode: 'insensitive' } } } }
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchOR }
        ];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.workTask.findMany({
        where,
        include: {
          user: { 
            select: { 
              id: true, 
              userCode: true, 
              profile: { select: { fullName: true, avatarUrl: true } },
              roles: { select: { role: { select: { code: true } } } }
            } 
          },
          department: { select: { id: true, name: true, code: true, leaderUserId: true } },
          updates: {
            where: query.date ? { reportDate: date } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [{ departmentId: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      }),
      this.prisma.workTask.count({ where })
    ]);

    const formattedItems = items.map(t => {
      const isLeader = t.department?.leaderUserId === t.userId || 
        t.user?.roles?.some((r: any) => ['LEADER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(r.role?.code));
      return {
        ...t,
        isLeader: Boolean(isLeader),
        latestUpdate: t.updates[0] || null
      };
    });

    return {
      items: formattedItems,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async adminUpdateTask(actor: AuthenticatedUser, taskId: string, dto: AdminUpdateWorkTaskDto) {
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Không tìm thấy');

    const reason = dto.reason || 'Admin cập nhật trạng thái';

    const data: any = {};
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.deadline !== undefined) data.deadline = dto.deadline;
    if (dto.workStatus !== undefined) data.workStatus = dto.workStatus;
    if (dto.approvalStatus !== undefined) data.approvalStatus = dto.approvalStatus;
    if (dto.userId !== undefined) data.userId = dto.userId;

    const updated = await this.prisma.workTask.update({
      where: { id: taskId },
      data
    });

    if (dto.workStatus) {
      const latestUpdate = await this.prisma.workTaskUpdate.findFirst({
        where: { taskId },
        orderBy: { reportDate: 'desc' }
      });
      if (latestUpdate) {
        await this.prisma.workTaskUpdate.update({
          where: { id: latestUpdate.id },
          data: {
            workStatus: dto.workStatus,
            progress: dto.workStatus === 'DONE' ? 100 : latestUpdate.progress
          }
        });
      }
    }

    await this.logHistory({
      taskId,
      actorUserId: actor.userId,
      action: 'ADMIN_UPDATE',
      reason
    });

    if (task.userId && task.userId !== actor.userId) {
      try {
        const isRejected = dto.approvalStatus === 'REJECTED';
        const action = isRejected ? 'REJECTED' : 'ADMIN_UPDATE';
        const title = isRejected ? 'Quản trị viên đã từ chối báo cáo công việc' : 'Quản trị viên đã cập nhật báo cáo công việc';
        const body = isRejected
          ? `Công việc "${task.title}" (${task.taskCode}) đã bị Quản trị viên từ chối: ${reason}`
          : `Công việc "${task.title}" (${task.taskCode}) đã được Admin cập nhật: ${reason}`;

        const notif = await this.notifications.createForUsers(this.prisma, [task.userId], {
          type: NotificationType.TASK_UPDATED,
          title,
          body,
          taskId: task.id,
          metadata: { taskId: task.id, taskCode: task.taskCode, action, approvalStatus: dto.approvalStatus, approvalNote: reason, rejectedByRole: 'ADMIN' }
        });
        if (notif) this.notifications.emitCreated(notif);

        this.realtime.emitToUser(task.userId, 'work-report:action', {
          taskId: task.id,
          taskCode: task.taskCode,
          action,
          approvalStatus: dto.approvalStatus,
          approvalNote: reason,
          title,
          body,
          reason,
          rejectedByRole: 'ADMIN'
        });

        if (isRejected && task.departmentId) {
          const dept = await this.prisma.department.findUnique({
            where: { id: task.departmentId },
            select: { leaderUserId: true }
          });
          const leaderUserId = dept?.leaderUserId;
          if (leaderUserId && leaderUserId !== actor.userId && leaderUserId !== task.userId) {
            const leaderTitle = 'Quản trị viên đã từ chối báo cáo của nhân viên';
            const leaderBody = `Công việc "${task.title}" (${task.taskCode}) của nhân viên đã bị Quản trị viên từ chối: ${reason}`;
            const leaderNotif = await this.notifications.createForUsers(this.prisma, [leaderUserId], {
              type: NotificationType.TASK_UPDATED,
              title: leaderTitle,
              body: leaderBody,
              taskId: task.id,
              metadata: { taskId: task.id, taskCode: task.taskCode, action: 'REJECTED', approvalStatus: 'REJECTED', approvalNote: reason, rejectedByRole: 'ADMIN', targetEmployeeId: task.userId }
            });
            if (leaderNotif) this.notifications.emitCreated(leaderNotif);

            this.realtime.emitToUser(leaderUserId, 'work-report:action', {
              taskId: task.id,
              taskCode: task.taskCode,
              action: 'REJECTED',
              approvalStatus: 'REJECTED',
              approvalNote: reason,
              title: leaderTitle,
              body: leaderBody,
              rejectedByRole: 'ADMIN',
              targetEmployeeId: task.userId
            });
          }
        }
      } catch (err) {}
    }

    if (task.departmentId) {
      this.realtime.emitToDepartment(task.departmentId, 'work-report:department_updated', {
        taskId: task.id,
        taskCode: task.taskCode,
        departmentId: task.departmentId,
        action: 'ADMIN_UPDATE'
      });
    }

    return updated;
  }

  async adminSoftDeleteTask(actor: AuthenticatedUser, taskId: string, reason: string) {
    const task = await this.prisma.workTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');

    const isAdmin = actor.roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.includes('LEADER');

    if (!isAdmin) {
      if (!isLeader) {
        throw new ForbiddenException('Bạn không có quyền xóa công việc này');
      }
      const leaderDepts = await this.prisma.department.findMany({
        where: { leaderUserId: actor.userId, isActive: true, deletedAt: null },
        select: { id: true }
      });
      const leaderDeptIds = leaderDepts.map((d: any) => d.id);
      if (task.departmentId && !leaderDeptIds.includes(task.departmentId)) {
        throw new ForbiddenException('Leader chỉ được phép xóa công việc thuộc phòng ban của mình');
      }
    }

    const deleteReason = reason || 'Xóa bởi Quản lý / Admin';
    const updated = await this.prisma.workTask.update({
      where: { id: taskId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: actor.userId,
        deleteReason: deleteReason
      }
    });

    await this.logHistory({
      taskId,
      actorUserId: actor.userId,
      action: 'DELETE',
      reason
    });

    if (updated.userId && updated.userId !== actor.userId) {
      try {
        const notif = await this.notifications.createForUsers(this.prisma, [updated.userId], {
          type: NotificationType.TASK_UPDATED,
          title: 'Công việc báo cáo đã bị xóa',
          body: `Công việc "${updated.title}" (${updated.taskCode}) đã được Admin xóa với lý do: ${reason}`,
          taskId: updated.id,
          metadata: { taskId: updated.id, taskCode: updated.taskCode, action: 'ADMIN_DELETE', reason }
        });
        if (notif) this.notifications.emitCreated(notif);

        this.realtime.emitToUser(updated.userId, 'work-report:action', {
          taskId: updated.id,
          taskCode: updated.taskCode,
          action: 'ADMIN_DELETE',
          reason,
          title: 'Công việc báo cáo đã bị xóa',
          body: `Công việc "${updated.title}" (${updated.taskCode}) đã bị Admin xóa. Lý do: ${reason}`
        });
      } catch (err) {}
    }

    if (updated.departmentId) {
      this.realtime.emitToDepartment(updated.departmentId, 'work-report:department_updated', {
        taskId: updated.id,
        action: 'ADMIN_DELETE',
        departmentId: updated.departmentId
      });
    }

    return updated;
  }

  async adminBatchDeleteTasks(actor: AuthenticatedUser, taskIds: string[], reason: string) {
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một công việc để xóa');
    }
    const results = [];
    for (const id of taskIds) {
      try {
        await this.adminSoftDeleteTask(actor, id, reason);
        results.push({ id, success: true });
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return { success: true, count: results.filter(r => r.success).length, results };
  }

  async adminBatchApproveTasks(actor: AuthenticatedUser, taskIds: string[], note?: string) {
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một công việc để duyệt');
    }
    const results = [];
    for (const taskId of taskIds) {
      try {
        const task = await this.prisma.workTask.findUnique({
          where: { id: taskId },
          include: { updates: { take: 1, orderBy: { createdAt: 'desc' } } }
        });
        if (task) {
          const updateId = task.updates?.[0]?.id;
          if (updateId) {
            await this.approveTaskUpdate(actor, taskId, updateId, { approvalStatus: 'APPROVED', approvalNote: note });
          } else {
            await this.prisma.workTask.update({
              where: { id: taskId },
              data: { approvalStatus: 'APPROVED' }
            });
          }
          results.push({ id: taskId, success: true });
        }
      } catch (err: any) {
        results.push({ id: taskId, success: false, error: err.message });
      }
    }
    return { success: true, count: results.filter(r => r.success).length, results };
  }

  async getHistory(actor: AuthenticatedUser, query: any) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.taskId) where.taskId = query.taskId;
    if (query.actorUserId) where.actorUserId = query.actorUserId;

    const [items, total] = await Promise.all([
      this.prisma.workReportHistory.findMany({
        where,
        include: {
          actor: { select: { id: true, profile: { select: { fullName: true } } } },
          task: { select: { taskCode: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.workReportHistory.count({ where })
    ]);

    return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async runCarryover(dateStr?: string) {
    const targetDate = dateStr || this.getTodayVN();
    const yesterdayDate = new Date(new Date(targetDate).getTime() - 24*60*60*1000).toISOString().split('T')[0];

    const unfinishedTasks = await this.prisma.workTask.findMany({
      where: {
        isDeleted: false,
        workStatus: { notIn: ['DONE', 'CANCELLED'] },
        OR: [
          { reportDate: yesterdayDate },
          { updates: { some: { reportDate: yesterdayDate } } },
          { isCarriedOver: true }
        ]
      }
    });

    let count = 0;
    for (const task of unfinishedTasks) {
      await this.prisma.workTask.update({
        where: { id: task.id },
        data: { isCarriedOver: true }
      });
      count++;
    }

    return { success: true, carriedOverCount: count };
  }

  async bulkSaveTasks(actor: AuthenticatedUser, dto: BulkSaveWorkReportsDto) {
    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r));
    const inWindow = this.isInReportingWindow();
    const date = dto.date || this.getTodayVN();

    const results: any[] = [];

    for (const item of dto.items) {
      if (!item.id || !this.isValidUuid(item.id) || item.id.startsWith('temp_') || item.id.startsWith('new_')) {
        const trimmedTitle = (item.title || '').trim();
        if (!trimmedTitle || trimmedTitle === 'Công việc mới') {
          continue;
        }

        if (!isAdmin && !isLeader && !inWindow) {
          throw new ForbiddenException('Chỉ được tạo công việc trong khung giờ 15:00 - 19:00');
        }

        const targetUserId = (isAdmin || isLeader) && item.userId ? item.userId : actor.userId;
        let deptId: string | null | undefined = item.departmentId;
        if (!deptId) {
          deptId = await this.getUserDeptId(targetUserId);
        }
        if (!deptId) {
          deptId = await this.getUserDeptId(actor.userId);
        }
        if (!deptId) throw new BadRequestException(`Không tìm thấy phòng ban cho nhân viên`);

        const taskCode = await this.generateTaskCode();
        const progress = item.workStatus === 'DONE' ? 100 : (item.progress ?? 0);
        const workStatus = progress === 100 ? 'DONE' : (item.workStatus || 'IN_PROGRESS');
        const approvalStatus = 'PENDING';

        const task = await this.prisma.workTask.create({
          data: {
            taskCode,
            userId: targetUserId,
            createdByUserId: actor.userId,
            departmentId: deptId,
            category: item.category || 'Theo kế hoạch',
            title: item.title || 'Công việc mới',
            description: item.description,
            taskType: item.taskType || 'REGULAR',
            priority: item.priority || 'MEDIUM',
            deadline: item.deadline,
            workStatus,
            approvalStatus,
            selfRating: item.selfRating ?? 5,
            attachments: item.attachments || [],
            reportDate: date,
            updates: {
              create: {
                reportDate: date,
                progress,
                workStatus,
                approvalStatus,
                notes: item.notes,
                obstacles: item.obstacles,
                supportRequest: item.supportRequest,
                selfRating: item.selfRating ?? 5,
                attachments: item.attachments || [],
                reportedByUserId: actor.userId,
                isProxied: targetUserId !== actor.userId,
                proxyReason: targetUserId !== actor.userId ? 'Leader/Admin nhập thay' : null,
                isDraft: dto.isDraft ?? false
              }
            }
          },
          include: {
            user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
            department: { select: { id: true, name: true, code: true } },
            updates: { where: { reportDate: date }, take: 1 }
          }
        });

        await this.logHistory({
          taskId: task.id,
          actorUserId: actor.userId,
          action: 'BULK_CREATE',
          reason: dto.isDraft ? 'Lưu nháp' : 'Gửi báo cáo'
        });

        results.push(task);
      } else {
        const existingTask = await this.prisma.workTask.findUnique({ where: { id: item.id } });
        if (!existingTask) continue;

        const isOwner = existingTask.userId === actor.userId;
        if (!isAdmin && !isLeader && !isOwner) {
          throw new ForbiddenException('Không có quyền cập nhật công việc này');
        }

        if (!isAdmin && !isLeader && !inWindow && !dto.isDraft) {
          throw new ForbiddenException('Chỉ được báo cáo trong khung giờ 15:00 - 19:00');
        }

        let workStatus = item.workStatus || existingTask.workStatus;
        if (item.progress === 100 || workStatus === 'DONE') {
          workStatus = 'DONE';
        }
        const progress = workStatus === 'DONE' ? 100 : (item.progress ?? 0);

        const taskUpdateData: any = { workStatus };
        if (item.category) taskUpdateData.category = item.category;
        if (item.title) taskUpdateData.title = item.title;
        if (item.description !== undefined) taskUpdateData.description = item.description;
        if (item.taskType) taskUpdateData.taskType = item.taskType;
        if (item.priority) taskUpdateData.priority = item.priority;
        if (item.deadline !== undefined) taskUpdateData.deadline = item.deadline;
        if (item.selfRating !== undefined) taskUpdateData.selfRating = item.selfRating;
        if (item.attachments !== undefined) taskUpdateData.attachments = item.attachments;
        if (!dto.isDraft) taskUpdateData.approvalStatus = 'PENDING';

        await this.prisma.workTask.update({
          where: { id: item.id },
          data: taskUpdateData
        });

        let update = await this.prisma.workTaskUpdate.findUnique({
          where: { taskId_reportDate: { taskId: item.id, reportDate: date } }
        });

        if (update) {
          update = await this.prisma.workTaskUpdate.update({
            where: { id: update.id },
            data: {
              progress,
              workStatus,
              approvalStatus: dto.isDraft ? update.approvalStatus : 'PENDING',
              notes: item.notes !== undefined ? item.notes : update.notes,
              obstacles: item.obstacles !== undefined ? item.obstacles : update.obstacles,
              supportRequest: item.supportRequest !== undefined ? item.supportRequest : update.supportRequest,
              selfRating: item.selfRating !== undefined ? item.selfRating : update.selfRating,
              attachments: item.attachments !== undefined ? item.attachments : update.attachments,
              isDraft: dto.isDraft ?? false,
              reportedByUserId: actor.userId,
              isProxied: !isOwner,
              proxyReason: !isOwner ? 'Leader/Admin cập nhật thay' : null
            }
          });
        } else {
          update = await this.prisma.workTaskUpdate.create({
            data: {
              taskId: item.id,
              reportDate: date,
              progress,
              workStatus,
              approvalStatus: 'PENDING',
              notes: item.notes,
              obstacles: item.obstacles,
              supportRequest: item.supportRequest,
              selfRating: item.selfRating ?? 5,
              attachments: item.attachments || [],
              isDraft: dto.isDraft ?? false,
              reportedByUserId: actor.userId,
              isProxied: !isOwner,
              proxyReason: !isOwner ? 'Leader/Admin cập nhật thay' : null
            }
          });
        }

        await this.logHistory({
          taskId: item.id,
          updateId: update.id,
          actorUserId: actor.userId,
          action: 'BULK_UPDATE',
          afterValue: { progress, workStatus, isDraft: dto.isDraft },
          reason: dto.isDraft ? 'Lưu nháp' : 'Gửi báo cáo'
        });

        results.push({ ...existingTask, ...taskUpdateData, latestUpdate: update });
      }
    }

    // Đồng bộ ngược lại sang DailyReport để Mobile App và các bảng tổng hợp nhận diện trạng thái SUBMITTED
    try {
      const affectedUserIds = new Set<string>(dto.items.map(i => i.userId || actor.userId).filter(Boolean));
      for (const uId of affectedUserIds) {
        const uDeptId = (await this.getUserDeptId(uId)) || (await this.getUserDepartmentId(uId));
        if (!uDeptId) continue;

        const dayTasks = await this.prisma.workTask.findMany({
          where: { userId: uId, reportDate: date, isDeleted: false },
          include: { updates: { where: { reportDate: date }, take: 1 } }
        });

        const completedTasks: any[] = [];
        const inProgressTasks: any[] = [];
        const allAttachments: any[] = [];
        const obstaclesArr: string[] = [];
        let maxRating = 5;

        dayTasks.forEach(t => {
          const upd = t.updates?.[0];
          const isDone = t.workStatus === 'DONE' || upd?.workStatus === 'DONE';
          const rObj = {
            taskId: t.id,
            taskCode: t.taskCode,
            title: t.title,
            description: t.description,
            category: t.category,
            taskType: t.taskType,
            priority: t.priority,
            deadline: t.deadline,
            status: isDone ? 'DONE' : (upd?.workStatus || t.workStatus),
            progress: upd?.progress ?? (isDone ? 100 : 0),
            notes: upd?.notes,
            obstacles: upd?.obstacles,
            supportRequest: upd?.supportRequest,
            attachments: upd?.attachments || t.attachments || [],
            isSelected: true
          };
          if (isDone) completedTasks.push(rObj);
          else inProgressTasks.push(rObj);

          if (upd?.obstacles) obstaclesArr.push(upd.obstacles);
          if (Array.isArray(rObj.attachments)) allAttachments.push(...rObj.attachments);
          if (typeof upd?.selfRating === 'number') maxRating = upd.selfRating;
          else if (typeof t.selfRating === 'number') maxRating = t.selfRating;
        });

        const targetStatus = dto.isDraft ? 'DRAFT' : 'SUBMITTED';

        const rep = await this.prisma.dailyReport.upsert({
          where: { userId_reportDate: { userId: uId, reportDate: date } },
          create: {
            userId: uId,
            departmentId: uDeptId,
            reportDate: date,
            roleType: actor.roles.includes('LEADER') ? 'LEADER' : 'EMPLOYEE',
            completedTasks,
            inProgressTasks,
            obstacles: obstaclesArr.length > 0 ? obstaclesArr.join('; ') : null,
            attachments: allAttachments,
            selfRating: maxRating,
            status: targetStatus
          },
          update: {
            completedTasks,
            inProgressTasks,
            obstacles: obstaclesArr.length > 0 ? obstaclesArr.join('; ') : undefined,
            attachments: allAttachments.length > 0 ? allAttachments : undefined,
            selfRating: maxRating,
            status: targetStatus,
            departmentId: uDeptId
          },
          include: {
            user: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
            department: { select: { id: true, name: true, leaderUserId: true } }
          }
        });

        if (!dto.isDraft) {
          const senderName = rep.user?.profile?.fullName || rep.user?.userCode || 'Nhân sự';
          this.realtime.emitToDepartment(uDeptId, 'daily_report:submitted', {
            reportId: rep.id,
            userId: uId,
            senderName,
            reportDate: date,
            roleType: rep.roleType
          });

          // Gửi thông báo đến Leader (nếu là nhân viên) và Admin
          const notifyUserIds = new Set<string>();
          if (rep.department?.leaderUserId && rep.department.leaderUserId !== uId) {
            notifyUserIds.add(rep.department.leaderUserId);
          }
          const adminRoles = await this.prisma.userRole.findMany({
            where: { role: { code: { in: ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'] } } },
            select: { userId: true, scopeType: true }
          });
          for (const ar of adminRoles) {
            if (ar.userId !== uId && (ar.scopeType === 'GLOBAL' || !ar.scopeType)) {
              notifyUserIds.add(ar.userId);
            }
          }
          if (notifyUserIds.size > 0) {
            const notif = await this.notifications.createForUsers(this.prisma, Array.from(notifyUserIds), {
              type: NotificationType.TASK_UPDATED,
              title: 'Báo cáo ngày mới',
              body: `${senderName} (${rep.department?.name || 'Phòng ban'}) đã nộp báo cáo ngày ${date}`,
              metadata: { reportId: rep.id, reportDate: date, userId: uId }
            });
            if (notif) this.notifications.emitCreated(notif);
          }
        }
      }
    } catch (syncErr) {
      console.error('[DailyReportsService] sync to DailyReport error in bulkSaveTasks:', syncErr);
    }

    return {
      success: true,
      savedCount: results.length,
      items: results
    };
  }
}

