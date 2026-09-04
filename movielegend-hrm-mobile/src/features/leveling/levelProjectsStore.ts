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

// 10 Gạch đầu dòng chuẩn từ Admin cho từng Level
const INITIAL_PROJECTS: LevelDepartmentProject[] = [
  {
    id: 'proj-lvl-1',
    levelNumber: 1,
    levelName: 'Level 1',
    targetTierTitle: 'Level 1 lên Level 2',
    departmentName: 'Phòng Livestream',
    projectName: 'Dự Án Level 1: Vận Hành Ca Live Cơ Bản',
    adminNote: 'Admin giao dự án 10 việc con cho phòng ban. Leader tiếp nhận và phân công cho nhân sự.',
    rewardItem: 'MacBook Air M3 + Thưởng 3.000.000đ/nhân sự',
    status: 'IN_PROGRESS',
    subTasks: [
      {
        id: 'st-1-1',
        orderNumber: 1,
        title: 'Setup ánh sáng & micro 15 ca live',
        description: 'Đảm bảo trước giờ live 30 phút hệ thống âm thanh, ánh sáng 3 điểm không bị lỗi.',
        targetKpi: '15 ca live đạt chuẩn kỹ thuật',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-2',
        orderNumber: 2,
        title: 'Dẫn chính 10 ca Livestream tiêu chuẩn',
        description: 'Duy trì năng lượng, phong thái chuyên nghiệp và tương tác liên tục với khán giả.',
        targetKpi: '10 ca live, thời lượng tối thiểu 1.5h/ca',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-3',
        orderNumber: 3,
        title: 'Thực thi checklist 12 bước trước khi live',
        description: 'Ký xác nhận vào sổ kiểm tra phòng livestream trước khi luồng phát bắt đầu.',
        targetKpi: '100% ca live có checklist ký số',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-4',
        orderNumber: 4,
        title: 'Ghim deal & đẩy voucher flash sale 12 phiên',
        description: 'Thao tác đẩy giỏ hàng chính xác theo nhịp giới thiệu sản phẩm của Host.',
        targetKpi: '12 phiên live khớp deal 100%',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-5',
        orderNumber: 5,
        title: 'Đạt mốc GMV thử thách tối thiểu 40 triệu',
        description: 'Doanh thu ghi nhận qua các ca trực tiếp tham gia hỗ trợ bán hàng.',
        targetKpi: 'GMV đạt từ 40 triệu trở lên',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-6',
        orderNumber: 6,
        title: 'Kiểm đếm mẫu sản phẩm trưng bày phòng live',
        description: 'Sắp xếp kệ trưng bày đúng layout thương hiệu và tem giá rõ ràng.',
        targetKpi: '100% mẫu live đủ tem mác',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-7',
        orderNumber: 7,
        title: 'Xử lý kịch bản tương tác và đọc comment',
        description: 'Ghim phản hồi comment nổi bật, báo Host trả lời ngay trong 10 giây.',
        targetKpi: 'Tỷ lệ phản hồi comment trên 90%',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-8',
        orderNumber: 8,
        title: 'Tổng hợp số liệu CCU & Views sau ca live',
        description: 'Ghi chép báo cáo vào file Drive phòng ban trong vòng 1h sau khi tắt live.',
        targetKpi: 'Đầy đủ báo cáo cho 15 ca',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-9',
        orderNumber: 9,
        title: 'Xử lý khiếu nại phát sinh trong 24h',
        description: 'Tiếp nhận thông tin khách hàng nhắn tin trong live và chuyển CSKH xử lý.',
        targetKpi: 'Giải quyết 100% ca trong 24h',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-1-10',
        orderNumber: 10,
        title: 'Đạt điểm bài test quy chuẩn văn hóa live',
        description: 'Đạt điểm tối đa bài kiểm tra quy tắc ứng xử và bảo mật phòng phát sóng.',
        targetKpi: 'Điểm test từ 95/100 trở lên',
        status: 'UNASSIGNED',
      },
    ],
  },
  {
    id: 'proj-lvl-2',
    levelNumber: 2,
    levelName: 'Level 2',
    targetTierTitle: 'Level 2 lên Level 3',
    departmentName: 'Phòng Livestream',
    projectName: 'Dự Án Level 2: Vận Hành Độc Lập & Bứt Phá Doanh Số',
    adminNote: 'Dự án yêu cầu năng lực độc lập tác chiến và cam kết chỉ tiêu doanh số.',
    rewardItem: 'MacBook Pro M3 + Thưởng 6.000.000đ/nhân sự',
    status: 'IN_PROGRESS',
    subTasks: [
      {
        id: 'st-2-1',
        orderNumber: 1,
        title: 'Điều phối độc lập 25 ca Livestream',
        description: 'Tự xử lý toàn bộ setup, âm thanh, ánh sáng và điều phối giỏ hàng.',
        targetKpi: '25 ca live độc lập hoàn hảo',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-2',
        orderNumber: 2,
        title: 'Đạt mốc GMV tích lũy tối thiểu 150 triệu',
        description: 'Doanh thu phòng live ghi nhận qua các ca dẫn chính.',
        targetKpi: 'GMV đạt từ 150 triệu trở lên',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-3',
        orderNumber: 3,
        title: 'Thiết kế 3 kịch bản chốt deal Mega Sale',
        description: 'Viết flow kịch bản tung deal theo khung giờ vàng để tăng đột biến đơn hàng.',
        targetKpi: '3 kịch bản được Leader phê duyệt',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-4',
        orderNumber: 4,
        title: 'Tối ưu tỷ lệ giữ chân người xem tăng 15%',
        description: 'Áp dụng các kỹ thuật giữ chân và gọi tên khán giả xuyên suốt ca phát sóng.',
        targetKpi: 'Thời gian xem trung bình tăng từ 15%',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-5',
        orderNumber: 5,
        title: 'Kiểm soát tồn kho realtime phiên Mega Live',
        description: 'Không để xảy ra tình trạng bán khống vượt số lượng tồn thực tế.',
        targetKpi: 'Tỷ lệ hủy đơn do hết hàng dưới 1%',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-6',
        orderNumber: 6,
        title: 'Sáng tạo 5 Mini-game tương tác đầu giờ',
        description: 'Tăng lượt chia sẻ và bình luận ngay trong 15 phút mở màn.',
        targetKpi: 'Lượt tương tác mở màn tăng 25%',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-7',
        orderNumber: 7,
        title: 'Kèm cặp thực hành cho 1 nhân sự Level 1',
        description: 'Hỗ trợ đồng nghiệp mới làm quen thiết bị và checklist vận hành.',
        targetKpi: 'Nhân sự kèm cặp vượt qua sát hạch',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-8',
        orderNumber: 8,
        title: 'Duy trì SLA ca trực trên 96% liên tục 2 tháng',
        description: 'Đi làm đúng giờ, không vắng mặt không phép, trang phục đúng chuẩn.',
        targetKpi: 'SLA đạt từ 96% trở lên',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-9',
        orderNumber: 9,
        title: 'Phân tích báo cáo sau live & đề xuất cải tiến',
        description: 'Dựa trên biểu đồ doanh thu từng phút để tối ưu cách đẩy sản phẩm.',
        targetKpi: 'Báo cáo phân tích có số liệu rõ ràng',
        status: 'UNASSIGNED',
      },
      {
        id: 'st-2-10',
        orderNumber: 10,
        title: 'Hoàn thành kỳ thi nâng bậc đạt loại Giỏi',
        description: 'Vượt qua bài test chuyên sâu về thuật toán luồng live và chính sách sàn.',
        targetKpi: 'Kết quả test đạt từ 90 điểm',
        status: 'UNASSIGNED',
      },
    ],
  },
  {
    id: 'proj-lvl-3',
    levelNumber: 3,
    levelName: 'Level 3',
    targetTierTitle: 'Level 3 lên Level 4',
    departmentName: 'Phòng Livestream',
    projectName: 'Dự Án Level 3: Tối Ưu Doanh Số & Kịch Bản Lớn',
    adminNote: 'Dự án nâng cao dành cho nhân sự nòng cốt.',
    rewardItem: 'MacBook Pro M3 Max + Thưởng 10.000.000đ/nhân sự',
    status: 'IN_PROGRESS',
    subTasks: [
      'Đạt mốc GMV 400 triệu trong chiến dịch quý',
      'Dẫn 5 phiên Mega Live doanh thu trên 100 triệu',
      'Biên soạn cẩm nang xử lý sự cố phòng live',
      'Xây dựng ma trận phân bổ voucher sàn',
      'Tổ chức workshop chia sẻ kinh nghiệm chốt deal',
      'Tối ưu tỷ lệ chuyển đổi đơn hàng trên 12%',
      'Đàm phán giá độc quyền với 3 nhãn hàng lớn',
      'Duy trì SLA ca trực 98% trong quý',
      'Thử nghiệm 2 hình thức livestream tương tác mới',
      'Bảo vệ đề án vận hành trước Ban Giám Đốc',
    ].map((title, i) => ({
      id: `st-3-${i + 1}`,
      orderNumber: i + 1,
      title,
      description: 'Chỉ tiêu công việc trọng điểm yêu cầu độ chuẩn xác cao.',
      targetKpi: 'Nghiệm thu đạt 100%',
      status: 'UNASSIGNED' as const,
    })),
  },
  {
    id: 'proj-lvl-4',
    levelNumber: 4,
    levelName: 'Level 4',
    targetTierTitle: 'Level 4 lên Level 5',
    departmentName: 'Phòng Livestream',
    projectName: 'Dự Án Level 4: Quản Trị Chiến Dịch & Đào Tạo Đội Ngũ',
    adminNote: 'Dự án cấp quản lý chiến lược và tối ưu hiệu suất toàn phòng ban.',
    rewardItem: 'Chuyến du lịch quốc tế + Thưởng 15.000.000đ/nhân sự',
    status: 'IN_PROGRESS',
    subTasks: [
      'Đạt mốc GMV 1 tỷ toàn chiến dịch phòng ban',
      'Đào tạo và kèm cặp 3 nhân sự lên Level 2 thành công',
      'Tối ưu chi phí vận hành phòng live giảm 10%',
      'Xây dựng quy trình chuẩn hóa ca live 4.0',
      'Duy trì tỷ lệ hoàn đơn dưới 3% toàn hệ thống',
      'Tổ chức sự kiện livestream kỷ niệm thương hiệu',
      'Phát triển 2 đối tác nhãn hàng chiến lược mới',
      'Đạt chỉ số hài lòng của khách hàng trên 98%',
      'Tối ưu tỷ lệ chuyển đổi trung bình đạt 15%',
      'Bảo vệ kế hoạch kinh doanh năm trước Hội đồng',
    ].map((title, i) => ({
      id: `st-4-${i + 1}`,
      orderNumber: i + 1,
      title,
      description: 'Chỉ tiêu cấp cao dành cho quản trị chiến lược.',
      targetKpi: 'Đạt chuẩn xuất sắc 100%',
      status: 'UNASSIGNED' as const,
    })),
  },
  {
    id: 'proj-lvl-5',
    levelNumber: 5,
    levelName: 'Level 5',
    targetTierTitle: 'Cấp Bậc Master Chuyên Gia',
    departmentName: 'Phòng Livestream',
    projectName: 'Dự Án Level 5: Định Hình Chiến Lược & Nhân Bản Mô Hình',
    adminNote: 'Dự án đỉnh cao dành cho cấp chuyên gia và quản lý cấp cao.',
    rewardItem: 'Gói cổ phần thưởng ESOP + Thưởng 30.000.000đ/nhân sự',
    status: 'IN_PROGRESS',
    subTasks: [
      'Dẫn dắt phòng ban đạt mốc GMV 3 tỷ trong quý',
      'Nhân bản mô hình phòng live sang chi nhánh mới',
      'Biên soạn giáo trình đào tạo chuẩn tập đoàn',
      'Tổ chức giải đấu Livestream Champion nội bộ',
      'Đạt giải thưởng Đội ngũ xuất sắc nhất năm',
      'Tối ưu tỷ lệ giữ chân nhân sự đạt 95%',
      'Thiết lập mạng lưới 20 KOL đối tác lớn',
      'Đạt tăng trưởng doanh số 50% so với cùng kỳ',
      'Tối ưu hóa quy trình báo cáo số liệu',
      'Hoàn thành bảo vệ luận đề quản trị xuất sắc',
    ].map((title, i) => ({
      id: `st-5-${i + 1}`,
      orderNumber: i + 1,
      title,
      description: 'Chỉ tiêu cấp chuyên gia xuất sắc.',
      targetKpi: 'Hoàn thành 100% chỉ tiêu',
      status: 'UNASSIGNED' as const,
    })),
  },
];

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
          adminNote: rp.adminNote || 'Admin giao dự án 10 việc con cho phòng ban. Leader tiếp nhận và phân công cho nhân sự.',
          rewardItem: rp.rewardItem || `Thưởng Level ${rp.levelNumber}`,
          status: rp.status || 'IN_PROGRESS',
          subTasks: (rp.subTasks || []).map((st: any, idx: number) => ({
            id: st.id || `st-${rp.levelNumber}-${idx + 1}`,
            orderNumber: st.orderNumber || idx + 1,
            title: st.title || `Công việc con ${idx + 1}`,
            description: st.description || 'Chỉ tiêu công việc trọng điểm yêu cầu độ chuẩn xác cao.',
            targetKpi: st.targetKpi || 'Nghiệm thu đạt 100%',
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
