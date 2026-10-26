import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationType } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { 
  CreateWorkTaskDto, 
  UpdateWorkTaskDto,
  CreateWorkTaskUpdateDto,
  ApproveWorkTaskUpdateDto,
  AdminUpdateWorkTaskDto,
  TransferWorkTaskDto,
  QueryWorkTasksDto,
  BulkSaveWorkReportsDto 
} from './dto/work-report.dto';

@Injectable()
export class WorkReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly scopes: DepartmentScopeService,
    private readonly realtime: RealtimeEventsService
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

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
    // 15:00 - 19:00
    return totalMinutes >= 15 * 60 && totalMinutes < 19 * 60;
  }

  private async generateTaskCode(): Promise<string> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CV${Date.now().toString().slice(-6)}${randomSuffix}`;
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
    const ledDept = await this.prisma.department.findFirst({
      where: { leaderUserId: userId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (ledDept) return ledDept.id;

    const membership = await this.prisma.departmentMember.findFirst({
      where: { userId, leftAt: null },
      select: { departmentId: true },
    });
    if (membership) return membership.departmentId;

    const anyDept = await this.prisma.department.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    return anyDept?.id || null;
  }

  // ─── Daily Reports to Work Tasks Synchronizer ─────────────────────────────

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
      // Bảo vệ: Tuyệt đối không tự động sinh WorkTask cho Quản trị viên hệ thống (Admin)
      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          userCode: true,
          roles: { select: { role: { select: { code: true } } } }
        }
      });
      const targetRoles = targetUser?.roles?.map(r => r.role?.code) || [];
      if (targetUser?.userCode === 'NV000001' || targetRoles.some(rc => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(rc))) {
        return null;
      }

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
        const isRejected = task.approvalStatus === 'REJECTED';
        const taskUpdateData: any = {
          category: data.category || task.category,
          description: data.description !== undefined ? data.description : task.description,
          taskType: data.taskType || task.taskType,
          priority: data.priority || task.priority,
          deadline: data.deadline !== undefined ? data.deadline : task.deadline,
          workStatus: data.workStatus || task.workStatus,
        };
        if (!isRejected && data.title && data.title !== 'Công việc mới') {
          taskUpdateData.title = data.title;
        }
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
          if (existingUpdate.approvalStatus !== 'REJECTED') {
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
          }
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
      console.error('[WorkReportsService] upsertTaskFromReportItem error:', err);
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
        include: {
          user: {
            select: {
              userCode: true,
              roles: { select: { role: { select: { code: true } } } }
            }
          }
        }
      });

      for (const r of dailyReports) {
        // Bỏ qua tài khoản Admin để không tự động sinh tasks cho Admin
        const userRoles = r.user?.roles?.map(ur => ur.role?.code) || [];
        const isUserAdmin = r.user?.userCode === 'NV000001' || userRoles.some(rc => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(rc));
        if (isUserAdmin) continue;
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
            deadline: t.deadline || t.expectedDate || null,
            workStatus: 'IN_PROGRESS',
            progress: typeof t.progress === 'number' ? t.progress : 50,
            notes: t.notes || t.note || null,
            obstacles: t.obstacles || null,
            supportRequest: t.supportRequest || null,
            selfRating: t.selfRating ?? r.selfRating ?? 5,
            attachments: t.attachments || [],
            reportDate: date,
            isDraft,
          });
        }

        // 3. Sync metrics (kết quả định lượng)
        const metrics = Array.isArray(r.metrics) ? r.metrics : [];
        for (const m of metrics as any[]) {
          if (!m || !m.name) continue;
          const title = m.value ? `${m.name}: ${m.value} ${m.unit || ''}`.trim() : m.name;
          const progress = m.progress ?? (m.value ? 100 : 50);
          const workStatus = progress === 100 ? 'DONE' : 'IN_PROGRESS';
          await this.upsertTaskFromReportItem({
            taskId: m.taskId,
            metricName: m.name,
            userId,
            departmentId: deptId,
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
            selfRating: m.selfRating ?? r.selfRating ?? 5,
            attachments: m.attachments || [],
            reportDate: date,
            isDraft,
          });
        }
      }
    } catch (err) {
      console.error('[WorkReportsService] syncDailyReportsToTasks error:', err);
    }
  }

  // ─── Employee APIs ───────────────────────────────────────────────────────

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
        { reportDate: date }, // Tạo ngày hôm nay
        { updates: { some: { reportDate: date } } }, // Có cập nhật hôm nay
        { // Việc cũ được chuyển tiếp (chưa hoàn thành)
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

    // Format output
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

    // Check window unless it's an admin (though admin usually has full access, we assume they use this endpoint if they want to act like a user)
    // Actually, only employee/leader checks window. Admin uses it freely if needed, but let's strictly check for employee.
    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    if (!isAdmin && !this.isInReportingWindow() && !dto.isTestBypass) {
      // Allow if it's makeup
      if (!dto.isMakeup) {
        throw new ForbiddenException('Chỉ được tạo/báo cáo công việc trong khung giờ 15:00 - 19:00');
      }
    }

    if (isProxy && !actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r)) && !isAdmin) {
      throw new ForbiddenException('Chỉ Leader/HR/Admin mới được nhập báo cáo thay');
    }

    const departmentId = await this.getUserDeptId(userId);
    if (!departmentId) throw new BadRequestException('Không tìm thấy phòng ban');

    const cleanTitle = (dto.title || '').trim();
    if (cleanTitle) {
      const existingSameDayTasks = await this.prisma.workTask.findMany({
        where: {
          userId,
          reportDate: date,
          isDeleted: false,
        },
        include: { updates: true }
      });
      const duplicate = existingSameDayTasks.find(
        (t) => (t.title || '').trim().toLowerCase() === cleanTitle.toLowerCase()
      );
      if (duplicate) {
        return duplicate;
      }
    }

    const todayVN = this.getTodayVN();
    const isFutureOrPlanned = date > todayVN || (dto.initialNotes || '').includes('Kế hoạch ngày mai');
    const taskCode = await this.generateTaskCode();
    const progress = (dto.initialProgress === 100) ? 100 : (dto.initialProgress || 0);
    const workStatus = progress === 100 ? 'DONE' : (isFutureOrPlanned && progress === 0 ? 'NOT_STARTED' : 'IN_PROGRESS');

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
            isDraft: isFutureOrPlanned ? true : false
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
    
    // Nhân viên không tự mở lại việc đã hoàn thành, trừ khi bị yêu cầu bổ sung
    if (task.workStatus === 'DONE' && workStatus !== 'DONE' && !isLeader && !isAdmin && task.approvalStatus !== 'NEED_MORE_INFO') {
      throw new ForbiddenException('Nhân viên không được tự mở lại công việc đã hoàn thành');
    }
    
    if (dto.progress === 100 || workStatus === 'DONE') {
      workStatus = 'DONE';
    }
    const progress = workStatus === 'DONE' ? 100 : (dto.progress ?? 0);

    // Tìm update hôm nay
    let update = await this.prisma.workTaskUpdate.findUnique({
      where: { taskId_reportDate: { taskId, reportDate: date } }
    });

    // Báo cáo đã gửi rồi thì không được thay đổi, chỉ xem lại (trừ khi Leader từ chối REJECTED hoặc yêu cầu bổ sung NEED_MORE_INFO)
    if (!isAdmin && !isLeader) {
      if ((task.approvalStatus === 'PENDING' || task.approvalStatus === 'APPROVED') && update && !update.isDraft) {
        throw new ForbiddenException('Công việc đã gửi báo cáo và đang chờ duyệt/đã duyệt. Không thể chỉnh sửa hoặc thay đổi tệp đính kèm.');
      }
    }

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

    // Sync task status
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

  // ─── Leader APIs ─────────────────────────────────────────────────────────

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
      // Kế toán không được xem báo cáo của phòng ban khác - chỉ xem phòng của mình
      const myDeptId = await this.getUserDeptId(actor.userId);
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const deptSet = new Set<string>();
      if (myDeptId) deptSet.add(myDeptId);
      ledDepts.forEach((id) => deptSet.add(id));
      visibleDepts = Array.from(deptSet);
    } else if (isHr && !isGlobalAdmin) {
      // HR chỉ xem báo cáo phòng ban của mình (trừ khi là Admin)
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
      // Kế toán không được xem báo cáo của phòng ban khác - chỉ xem phòng của mình
      const myDeptId = await this.getUserDeptId(actor.userId);
      const ledDepts = await this.scopes.getLedDepartmentIds(actor);
      const deptSet = new Set<string>();
      if (myDeptId) deptSet.add(myDeptId);
      ledDepts.forEach((id) => deptSet.add(id));
      visibleDepts = Array.from(deptSet);
    } else if (isHr && !isGlobalAdmin) {
      // HR chỉ xem báo cáo phòng ban của mình (trừ khi là Admin)
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

    // Bao gồm cả các nhân sự đã nộp báo cáo qua DailyReport (Mobile & Web)
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

    // Update main task status
    await this.prisma.workTask.update({
      where: { id: taskId },
      data: { approvalStatus: dto.approvalStatus }
    });

    // Đồng bộ trạng thái duyệt sang DailyReport (Báo cáo ngày mobile)
    try {
      const dailyReport = await this.prisma.dailyReport.findUnique({
        where: { userId_reportDate: { userId: update.task.userId, reportDate: update.reportDate } },
      });
      if (dailyReport) {
        const syncItems = (items: any[]) => {
          if (!Array.isArray(items)) return items;
          return items.map((item) => {
            const matchId = item.taskId === taskId || item.id === taskId;
            const matchTitle =
              item.title === update.task.title ||
              item.name === update.task.title ||
              (item.title && update.task.title && item.title.split(':')[0].trim() === update.task.title.split(':')[0].trim());
            if (matchId || matchTitle) {
              return {
                ...item,
                approvalStatus: dto.approvalStatus,
                approvalNote: dto.approvalNote || null,
              };
            }
            return item;
          });
        };

        const allTasks = await this.prisma.workTask.findMany({
          where: { userId: update.task.userId, reportDate: update.reportDate, isDeleted: false },
        });
        const allRejected =
          allTasks.length > 0 &&
          allTasks.every((t) => (t.id === taskId ? dto.approvalStatus === 'REJECTED' : t.approvalStatus === 'REJECTED'));

        await this.prisma.dailyReport.update({
          where: { id: dailyReport.id },
          data: {
            metrics: syncItems(dailyReport.metrics as any[]),
            completedTasks: syncItems(dailyReport.completedTasks as any[]),
            inProgressTasks: syncItems(dailyReport.inProgressTasks as any[]),
            status: allRejected ? 'REJECTED' : dailyReport.status,
            adminReview:
              dto.approvalStatus === 'REJECTED' ? dto.approvalNote || dailyReport.adminReview : dailyReport.adminReview,
            reviewedById: actor.userId,
            reviewedAt: new Date(),
          },
        });

        this.realtime.emitToDepartment(dailyReport.departmentId, 'daily_report:updated', {
          reportId: dailyReport.id,
          userId: dailyReport.userId,
          reportDate: dailyReport.reportDate,
          status: allRejected ? 'REJECTED' : dailyReport.status,
        });
      }
    } catch (syncErr) {
      console.warn('[approveTaskUpdate] Sync to dailyReport error:', syncErr);
    }

    await this.logHistory({
      taskId,
      updateId,
      actorUserId: actor.userId,
      action: 'APPROVE',
      afterValue: { approvalStatus: dto.approvalStatus, approvalNote: dto.approvalNote }
    });

    // Phát thông báo Socket & Notification cho nhân viên và phòng ban
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
          metadata: {
            taskId: update.task.id,
            taskCode: update.task.taskCode,
            action,
            approvalStatus: dto.approvalStatus,
            approvalNote: dto.approvalNote,
            rejectedByRole: isAdmin ? 'ADMIN' : 'LEADER',
            rejectedByName: (actor as any).fullName || approverRoleName,
            targetUrl: '/my-daily-report',
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
          rejectedByRole: isAdmin ? 'ADMIN' : 'LEADER',
          targetUrl: '/my-daily-report'
        });
      } catch (err) {
        console.error('[approveTaskUpdate] notification error:', err);
      }
    }

    // CHỈ gửi thông báo cho Leader khi người từ chối là ADMIN (Leader không cần nhận lại chính thao tác của mình)
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
      } catch (err) {
        // Safe catch
      }
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

    // Thông báo cho nhân sự mới và cũ qua Socket
    try {
      if (dto.newUserId) {
        const notif = await this.notifications.createForUsers(this.prisma, [dto.newUserId], {
          type: NotificationType.TASK_ASSIGNED,
          title: 'Bạn được bàn giao công việc mới',
          body: `Công việc "${task.title}" (${task.taskCode}) đã được chuyển giao cho bạn. Lý do: ${dto.reason || 'Điều phối công việc'}`,
          metadata: { taskId: task.id, taskCode: task.taskCode, action: 'TRANSFER', targetUrl: '/my-daily-report' }
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

  // ─── Admin APIs ──────────────────────────────────────────────────────────

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

    // Thông báo cho nhân viên qua Socket & In-app Notification
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
          metadata: { taskId: task.id, taskCode: task.taskCode, action, approvalStatus: dto.approvalStatus, approvalNote: reason, rejectedByRole: 'ADMIN', targetUrl: '/my-daily-report' }
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

    // Thông báo cho nhân sự khi Admin xóa công việc
    if (updated.userId && updated.userId !== actor.userId) {
      try {
        const notif = await this.notifications.createForUsers(this.prisma, [updated.userId], {
          type: NotificationType.TASK_UPDATED,
          title: 'Công việc báo cáo đã bị xóa',
          body: `Công việc "${updated.title}" (${updated.taskCode}) đã được Admin xóa với lý do: ${reason}`,
          metadata: { taskId: updated.id, taskCode: updated.taskCode, action: 'ADMIN_DELETE', reason, targetUrl: '/my-daily-report' }
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

  // ─── Cron / System ───────────────────────────────────────────────────────

  async runCarryover(dateStr?: string) {
    const targetDate = dateStr || this.getTodayVN();
    const yesterdayDate = new Date(new Date(targetDate).getTime() - 24*60*60*1000).toISOString().split('T')[0];

    // Lấy các task hôm qua chưa xong
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
      // Đánh dấu carried over
      await this.prisma.workTask.update({
        where: { id: task.id },
        data: { isCarriedOver: true }
      });
      count++;
    }

    return { success: true, carriedOverCount: count };
  }

  // ─── Bulk Save (Excel Grid) ────────────────────────────────────────────────

  async bulkSaveTasks(actor: AuthenticatedUser, dto: BulkSaveWorkReportsDto) {
    const isAdmin = actor.roles.some(r => ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(r));
    const isLeader = actor.roles.some(r => ['LEADER', 'MANAGER', 'DEPARTMENT_HEAD', 'HR', 'ACCOUNTANT_LEAD'].includes(r));
    const isTestBypass = Boolean((dto as any).isTestBypass);
    const inWindow = this.isInReportingWindow() || isTestBypass;
    const date = dto.date || this.getTodayVN();

    const results: any[] = [];

    for (const item of dto.items) {
      // If it's a new task (no ID or temp ID)
      if (!item.id || item.id.startsWith('temp_') || item.id.startsWith('new_')) {
        const trimmedTitle = (item.title || '').trim();
        // Tuyệt đối không tạo công việc nếu tiêu đề rỗng hoặc chỉ là placeholder
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
        // Existing task: update
        const existingTask = await this.prisma.workTask.findUnique({ where: { id: item.id } });
        if (!existingTask) continue;

        const isOwner = existingTask.userId === actor.userId;
        if (!isAdmin && !isLeader && !isOwner) {
          throw new ForbiddenException('Không có quyền cập nhật công việc này');
        }

        // 1. TUYỆT ĐỐI KHÔNG cập nhật hoặc đổi trạng thái công việc đã DUYỆT (APPROVED) (trừ Admin tối cao)
        if (existingTask.approvalStatus === 'APPROVED' && !isAdmin) {
          continue; // Bỏ qua, bảo vệ 100% công việc đã duyệt không bị ghi đè hoặc hạ trạng thái
        }

        // 2. Nhiệm vụ ĐANG CHỜ DUYỆT (PENDING) đã gửi chính thức: Khóa chặt, không cho sửa đè
        if (existingTask.approvalStatus === 'PENDING' && !isAdmin) {
          const update = await this.prisma.workTaskUpdate.findUnique({
            where: { taskId_reportDate: { taskId: item.id, reportDate: date } }
          });
          if (update && !update.isDraft) {
            continue; // Bỏ qua công việc đã nộp đang chờ duyệt
          }
        }

        // 3. Báo cáo đã gửi rồi thì CHỈ ĐƯỢC PHÉP SỬA khi Leader từ chối (REJECTED) hoặc yêu cầu bổ sung (NEED_MORE_INFO)
        const isRejectedTask = existingTask.approvalStatus === 'REJECTED' || existingTask.approvalStatus === 'NEED_MORE_INFO';
        if (!isAdmin) {
          const update = await this.prisma.workTaskUpdate.findUnique({
            where: { taskId_reportDate: { taskId: item.id, reportDate: date } }
          });
          const isSubmitted = (!update || !update.isDraft);
          if (isSubmitted && !isRejectedTask && existingTask.approvalStatus !== 'DRAFT') {
            continue;
          }
        }

        if (!isAdmin && !isLeader && !inWindow && !dto.isDraft && !isRejectedTask) {
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

    return {
      success: true,
      savedCount: results.length,
      items: results
    };
  }
}
