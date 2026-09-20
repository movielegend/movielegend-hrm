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
    const status = dto.isDraft ? 'DRAFT' : 'SUBMITTED';

    // Kiểm tra xem báo cáo ngày này đã tồn tại chưa
    const existing = await this.prisma.dailyReport.findUnique({
      where: { userId_reportDate: { userId, reportDate } },
      include: { reviewedBy: { select: { profile: { select: { fullName: true } } } } },
    });

    if (existing && (existing.status === 'SUBMITTED' || existing.status === 'REVIEWED')) {
      throw new ForbiddenException(
        existing.status === 'REVIEWED'
          ? `Báo cáo ngày ${reportDate} đã được ${existing.reviewedBy?.profile?.fullName || 'Admin'} đánh giá, không thể chỉnh sửa.`
          : `Bạn đã nộp báo cáo cho ngày ${reportDate} rồi. Mỗi ngày chỉ được gửi báo cáo 1 lần.`
      );
    }

    const report = await this.prisma.dailyReport.upsert({
      where: { userId_reportDate: { userId, reportDate } },
      create: {
        userId,
        departmentId,
        reportDate,
        roleType,
        metrics: (dto.metrics as any) || [],
        completedTasks: (dto.completedTasks as any) || [],
        inProgressTasks: (dto.inProgressTasks as any) || [],
        obstacles: dto.obstacles || null,
        tomorrowPlan: (dto.tomorrowPlan as any) || [],
        attachments: (dto.attachments as any) || [],
        selfRating: dto.selfRating || 5,
        selfReview: dto.selfReview || null,
        status,
      },
      update: {
        metrics: dto.metrics !== undefined ? (dto.metrics as any) : undefined,
        completedTasks: dto.completedTasks !== undefined ? (dto.completedTasks as any) : undefined,
        inProgressTasks: dto.inProgressTasks !== undefined ? (dto.inProgressTasks as any) : undefined,
        obstacles: dto.obstacles !== undefined ? dto.obstacles : undefined,
        tomorrowPlan: dto.tomorrowPlan !== undefined ? (dto.tomorrowPlan as any) : undefined,
        attachments: dto.attachments !== undefined ? (dto.attachments as any) : undefined,
        selfRating: dto.selfRating !== undefined ? dto.selfRating : undefined,
        selfReview: dto.selfReview !== undefined ? dto.selfReview : undefined,
        status,
        departmentId,
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        department: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, userCode: true, profile: { select: { fullName: true } } } },
      },
    });

    // Nếu là nộp chính thức (SUBMITTED), phát thông báo
    if (status === 'SUBMITTED') {
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
      return existing;
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

    // Tự động phân loại Task hoàn thành & Task đang làm
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

    return {
      id: null,
      userId,
      departmentId,
      reportDate,
      roleType: actor.roles.includes('LEADER') ? 'LEADER' : 'EMPLOYEE',
      metrics: [
        { name: 'Khách hàng mới / Đã tư vấn', value: '', note: '' },
        { name: 'Đơn hàng thành công', value: '', note: '' },
        { name: 'Doanh số hôm nay (VNĐ)', value: '', note: '' },
        { name: 'Chăm sóc khách hàng / Hỗ trợ', value: '', note: '' },
      ],
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
   * 4. Leader xem danh sách báo cáo phòng ban theo ngày
   */
  async getDepartmentReports(actor: AuthenticatedUser, departmentId?: string, dateStr?: string) {
    const reportDate = dateStr || getTodayString();
    let targetDeptId = departmentId;

    if (!targetDeptId) {
      targetDeptId = (await this.getUserDepartmentId(actor.userId)) || undefined;
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
    const reports = await this.prisma.dailyReport.findMany({
      where: {
        departmentId: targetDeptId,
        reportDate,
      },
      include: {
        user: { select: { id: true, userCode: true, profile: { select: { fullName: true, avatarUrl: true } } } },
        reviewedBy: { select: { id: true, profile: { select: { fullName: true } } } },
      },
    });

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
    let targetDeptId = departmentId || (await this.getUserDepartmentId(actor.userId));

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
      include: { user: { select: { id: true, profile: { select: { fullName: true } } } } },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    if (!dto.planItems || dto.planItems.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 đầu việc kế hoạch để tạo Task');
    }

    const dueAt = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Ngày mai

    const createdTasks = [];
    for (const itemTitle of dto.planItems) {
      if (!itemTitle || !itemTitle.trim()) continue;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const taskCode = `TSK-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

      const task = await this.prisma.task.create({
        data: {
          taskCode,
          title: itemTitle.trim(),
          description: `Nhiệm vụ được tạo từ Kế hoạch ngày mai trong Báo cáo ngày ${report.reportDate}`,
          departmentContextId: report.departmentId,
          createdByUserId: actor.userId,
          priority: 'NORMAL',
          status: 'NEW',
          dueAt,
          assignments: {
            create: [
              {
                userId: report.userId,
                assignedByUserId: actor.userId,
                status: 'NEW',
              },
            ],
          },
        },
      });
      createdTasks.push(task);
    }

    // Thông báo cho nhân viên
    setImmediate(async () => {
      try {
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
            type: 'TASK_ASSIGNED',
            title: 'Nhiệm vụ mới cho ngày mai 📋',
            body: `Leader đã duyệt kế hoạch và giao ${createdTasks.length} nhiệm vụ cho bạn.`,
            metadata: {
              reportId: report.id,
              tasksCount: createdTasks.length,
            },
          });
          if (payload) this.notifications.emitCreated(payload);
        });
      } catch (e) {
        console.error('[DailyReports] Failed to notify task conversion:', e);
      }
    });

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

    const visibleDepts = await this.scopes.getVisibleDepartmentIds(actor);

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

    const [items, total] = await Promise.all([
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

    // Cơ chế khóa 1 người duyệt (Single-Review Lock)
    if (report.reviewedById && report.reviewedById !== actor.userId) {
      const reviewerName = report.reviewedBy?.profile?.fullName || 'Admin khác';
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
        const adminName = updated.reviewedBy?.profile?.fullName || 'Admin';
        await this.prisma.$transaction(async (tx) => {
          const payload = await this.notifications.createForUsers(tx as any, [report.userId], {
            type: 'TASK_UPDATED',
            title: `Báo cáo ngày ${report.reportDate} đã được đánh giá ⭐`,
            body: `${adminName} đã đánh giá ${dto.adminRating}/5 sao: "${dto.adminReview || 'Đã duyệt'}"`,
            metadata: {
              reportId: report.id,
              adminRating: dto.adminRating,
              adminReview: dto.adminReview,
              reviewedById: actor.userId,
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

    return report;
  }
}
