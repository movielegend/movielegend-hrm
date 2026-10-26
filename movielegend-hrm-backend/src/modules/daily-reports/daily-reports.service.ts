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
import {
  CreateDailyReportDto,
  ReviewDailyReportDto,
  ConvertPlanToTasksDto,
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
   * Admin / Leader từ chối toàn bộ báo cáo ngày của nhân sự
   */
  async rejectReport(actor: AuthenticatedUser, reportId: string, dto: { reason: string }) {
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
}
