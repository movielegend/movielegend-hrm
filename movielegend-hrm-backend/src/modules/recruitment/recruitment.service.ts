import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApplicationStatus, JobStatus, NotificationType, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { MediaStorageService } from '../storage/media-storage.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { badRequest, notFound } from '../../common/utils/error.util';
import { JobQueryDto } from './dto/job-query.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateShowroomDto } from './dto/create-showroom.dto';
import { calculateCandidateMatchScore } from './match-score.util';

function formatToDateString(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function parseToDate(dateStr: string): Date {
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
    const [d, m, y] = dateStr.split('-');
    return new Date(`${y}-${m}-${d}T23:59:59.000Z`);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDateTimeVn(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
    private readonly realtime: RealtimeEventsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // ==========================================
  // PUBLIC METHODS (Dành cho web tuyển dụng hrm)
  // ==========================================

  /**
   * Lấy danh sách việc làm công khai với bộ lọc và phân trang
   */
  async getJobs(query: JobQueryDto) {
    const page = Math.max(0, Number(query.page || 0));
    const size = Math.max(1, Math.min(100, Number(query.size || 10)));
    const skip = page * size;

    const where: Prisma.JobPostingWhereInput = {
      status: JobStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.keyword?.trim()) {
      const kw = query.keyword.trim();
      where.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { departmentName: { contains: kw, mode: 'insensitive' } },
        { rankName: { contains: kw, mode: 'insensitive' } },
        { province: { contains: kw, mode: 'insensitive' } },
        { skillTags: { has: kw } },
        { jobDescriptionVn: { contains: kw, mode: 'insensitive' } },
      ];
    }

    if (query.departmentName?.trim()) {
      where.departmentName = { contains: query.departmentName.trim(), mode: 'insensitive' };
    }

    if (query.workGroupId?.trim()) {
      const rawGroupId = query.workGroupId.trim();
      const workGroups = await this.getWorkGroups();
      const matched = workGroups.find(
        (g) =>
          String(g.id) === rawGroupId ||
          g.code.toLowerCase() === rawGroupId.toLowerCase() ||
          g.name.toLowerCase() === rawGroupId.toLowerCase(),
      );
      if (matched) {
        const lowerMatched = matched.name.toLowerCase();
        if (lowerMatched.includes('phần mềm') || lowerMatched.includes('phan mem')) {
          where.OR = [
            { departmentName: { contains: matched.name, mode: 'insensitive' } },
            { departmentName: { contains: 'IT', mode: 'insensitive' } },
          ];
        } else if (lowerMatched === 'kỹ thuật' || lowerMatched === 'ky thuat') {
          where.OR = [
            { departmentName: { contains: matched.name, mode: 'insensitive' } },
            { departmentName: { contains: 'Máy chiếu', mode: 'insensitive' } },
          ];
        } else {
          where.departmentName = { contains: matched.name, mode: 'insensitive' };
        }
      } else {
        where.departmentName = { contains: rawGroupId, mode: 'insensitive' };
      }
    }

    if (query.province?.trim()) {
      where.province = { contains: query.province.trim(), mode: 'insensitive' };
    }

    if (query.regionCode?.trim()) {
      where.regionCode = query.regionCode.trim();
    }

    if (query.experience?.trim()) {
      where.experienceRequired = { contains: query.experience.trim(), mode: 'insensitive' };
    }

    if (query.rank?.trim()) {
      where.rankName = { contains: query.rank.trim(), mode: 'insensitive' };
    }

    const [totalElements, jobs] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedContent = jobs.map((job) => ({
      ...job,
      branchName: job.regionName || job.province,
      toDate: formatToDateString(job.toDate),
      workGroupName: job.departmentName, // Alias để tương thích giao diện FE MBBank
    }));

    return {
      content: formattedContent,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      size,
      number: page,
      first: page === 0,
      last: skip + size >= totalElements,
      empty: jobs.length === 0,
    };
  }

  /**
   * Xem chi tiết 1 tin tuyển dụng và tăng số lượt xem
   */
  async getJobDetail(idOrCode: string) {
    const job = await this.prisma.jobPosting.findFirst({
      where: {
        OR: [{ id: idOrCode }, { newCode: idOrCode }],
        deletedAt: null,
      },
    });

    if (!job) {
      throw notFound('JOB_NOT_FOUND', 'Không tìm thấy tin tuyển dụng này');
    }

    // Tăng lượt xem (không chặn nếu update viewCount có lỗi)
    this.prisma.jobPosting
      .update({
        where: { id: job.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => this.logger.warn(`Lỗi tăng viewCount job ${job.id}: ${err.message}`));

    return {
      ...job,
      branchName: job.regionName || job.province,
      toDate: formatToDateString(job.toDate),
      workGroupName: job.departmentName,
    };
  }

  /**
   * Lấy danh sách các nhóm ngành tuyển dụng (từ cấu hình danh mục kèm số lượng tin)
   */
  async getWorkGroups() {
    const categories = await this.getCategories();
    const configuredGroups: string[] = categories.workGroups || [];

    const jobCounts = await this.prisma.jobPosting.groupBy({
      by: ['departmentName'],
      where: {
        status: JobStatus.PUBLISHED,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const jc of jobCounts) {
      if (jc.departmentName) {
        countMap.set(jc.departmentName.trim().toLowerCase(), jc._count.id);
      }
    }

    const slugify = (text: string): string =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const result: Array<{
      id: number;
      code: string;
      name: string;
      total: number;
      iconUrl: string;
      bannerImage?: string;
    }> = [];
    const handledNames = new Set<string>();

    configuredGroups.forEach((groupItem: any, index: number) => {
      const groupName = typeof groupItem === 'string' ? groupItem : groupItem.name;
      const groupBanner = typeof groupItem === 'object' ? String(groupItem.bannerImage || groupItem.iconUrl || '').trim() : '';

      const lower = groupName.trim().toLowerCase();
      let total = countMap.get(lower) || 0;

      // Ánh xạ tương thích cho IT và Kỹ thuật & Setup Máy chiếu
      if (lower.includes('phần mềm') || lower.includes('phan mem')) {
        total += countMap.get('it') || 0;
      }
      if (lower === 'kỹ thuật' || lower === 'ky thuat') {
        total += (countMap.get('kỹ thuật & setup máy chiếu') || 0) + (countMap.get('ky thuat & setup may chieu') || 0);
      }

      const code = slugify(groupName) || ('group-' + (index + 1));

      result.push({
        id: index + 1,
        code,
        name: groupName,
        total,
        iconUrl: groupBanner || ('/assets/images/' + (index % 2 === 0 ? 'cong-nghe' : 'kinh-doanh') + '.png'),
        bannerImage: groupBanner || '',
      });
    });

    return result;
  }

  /**
   * Lấy danh sách các phòng ban đang mở tuyển dụng (kèm số lượng tin)
   */
  async getDepartments() {
    return this.getWorkGroups();
  }

  /**
   * Thống kê tổng số tin tuyển dụng theo vùng miền & khối ngành
   */
  async getRecruitmentStats() {
    const [totalNews, hanoiCount, hcmCount, mienBacCount, mienNamCount] = await Promise.all([
      this.prisma.jobPosting.count({ where: { status: JobStatus.PUBLISHED, deletedAt: null } }),
      this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
          province: { contains: 'Hà Nội', mode: 'insensitive' },
        },
      }),
      this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
          province: { contains: 'Hồ Chí Minh', mode: 'insensitive' },
        },
      }),
      this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
          regionCode: 'MIEN_BAC',
        },
      }),
      this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          deletedAt: null,
          regionCode: 'MIEN_NAM',
        },
      }),
    ]);

    const depts = await this.getDepartments();

    return {
      totalNews,
      haNoi: { code: 'TX103', total: hanoiCount },
      hcm: { code: 'TX105', total: hcmCount },
      mienBac: { code: 'MIEN_BAC', total: mienBacCount },
      mienNam: { code: 'MIEN_NAM', total: mienNamCount },
      departments: depts,
    };
  }

  // ==========================================
  // SHOWROOMS / CƠ SỞ (Movie Legend Showroom System)
  // ==========================================

  private getCategoriesFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_categories.json');
  }

  async getCategories() {
    try {
      const filePath = this.getCategoriesFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && (Array.isArray(parsed.skills) || Array.isArray(parsed.workGroups))) {
          const rawGroups = Array.isArray(parsed.workGroups) ? parsed.workGroups : [];
          const normalizedGroups = rawGroups
            .map((g: any) => {
              if (typeof g === 'string') {
                return { name: g.trim(), bannerImage: '' };
              }
              return {
                name: String(g?.name || '').trim(),
                bannerImage: String(g?.bannerImage || g?.imageUrl || '').trim(),
              };
            })
            .filter((g: any) => g.name);

          return {
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            workGroups: normalizedGroups,
          };
        }
      }
    } catch (err) {
      this.logger.error('Failed to read categories from storage:', err);
    }
    return {
      skills: [
        'Laser 4K',
        'Âm thanh vòm',
        'Dolby Atmos',
        'Setup máy chiếu',
        'Home Cinema',
        'Tư vấn',
        'Bán hàng',
        'Marketing',
        'Kỹ thuật điện',
        'Chăm sóc khách hàng',
        'Giao nhận & Lắp đặt',
        'Quản lý kho',
      ],
      workGroups: [
        { name: 'Kỹ thuật & Setup Máy chiếu', bannerImage: '/assets/images/cong-nghe.png' },
        { name: 'Kinh doanh & Tư vấn giải pháp', bannerImage: '/assets/images/kinh-doanh.png' },
        { name: 'Marketing & Truyền thông', bannerImage: '/assets/images/truyen-thong.png' },
        { name: 'Vận hành & Hậu cần', bannerImage: '/assets/images/van-hanh.png' },
        { name: 'Tài chính & Kế toán', bannerImage: '/assets/images/tai-chinh.png' },
        { name: 'Nhân sự & Hành chính', bannerImage: '/assets/images/workplace.png' },
      ],
    };
  }

  async updateCategories(dto: { skills?: string[]; workGroups?: Array<string | { name: string; bannerImage?: string; iconUrl?: string }> }) {
    const current = await this.getCategories();

    let updatedGroups = current.workGroups;
    if (Array.isArray(dto.workGroups)) {
      const seen = new Set<string>();
      updatedGroups = [];
      for (const item of dto.workGroups) {
        const name = typeof item === 'string' ? item.trim() : String(item?.name || '').trim();
        const bannerImage = typeof item === 'object' ? String(item?.bannerImage || item?.iconUrl || '').trim() : '';
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          updatedGroups.push({ name, bannerImage });
        }
      }
    }

    const updated = {
      skills: Array.isArray(dto.skills)
        ? Array.from(new Set(dto.skills.map((s: string) => String(s).trim()).filter(Boolean)))
        : current.skills,
      workGroups: updatedGroups,
    };
    try {
      const filePath = this.getCategoriesFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save categories to storage:', err);
    }
    return updated;
  }

  // ==========================================
  // CAMPAIGN BANNERS (Khám phá / Cơ hội đặc biệt)
  // ==========================================

  private getCampaignBannersFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_banners.json');
  }

  async getCampaignBanners() {
    const defaultBanners = [
      {
        id: 'slide-cinema-flagship',
        title: 'Đam mê Điện ảnh - Kiến tạo Rạp phim Tại Gia',
        subtitle: 'Trải nghiệm công nghệ máy chiếu Laser TV siêu gần, độ phân giải 4K HDR và âm thanh vòm Dolby Atmos chuẩn Hollywood.',
        image: '/assets/images/showcase-fifa-cinema.jpg',
        tag: 'Home Cinema Flagship',
        bgClass: 'bg-slate-950',
        active: true,
        order: 1,
      },
      {
        id: 'slide-tay-bac',
        title: 'Ai yêu cung đường Tây Bắc hơn Anh?',
        subtitle: 'Đồng hành cùng tuổi trẻ trên mọi nẻo đường đất nước - Movie Legend Showroom',
        image: '/assets/images/home_about/sp_op_1.png',
        tag: 'Miền Bắc • Tây Bắc',
        bgClass: 'bg-white',
        active: true,
        order: 2,
      },
      {
        id: 'slide-mien-trung',
        title: 'Ai yêu non nước đại ngàn Miền Trung hơn Anh?',
        subtitle: 'Đồng hành cùng các dự án homestay, villa & rạp chiếu nghỉ dưỡng cao cấp',
        image: '/assets/images/home_about/sp_op_3.png',
        tag: 'Miền Trung • Nghỉ dưỡng',
        bgClass: 'bg-[#FFFDF7]',
        active: true,
        order: 3,
      },
      {
        id: 'slide-mien-tay',
        title: 'Ai yêu hạt gạo Đồng bằng Sông Cửu Long hơn Anh?',
        subtitle: 'MANG CÔNG NGHỆ VỀ LẠI MIỀN TÂY CÙNG NHAU CHUNG SỨC, DỰNG XÂY QUÊ MÌNH!',
        image: '/assets/images/home_about/sp_op_2.png',
        tag: 'Miền Tây • Sông Cửu Long',
        bgClass: 'bg-[#FEFCE8]',
        active: true,
        order: 4,
      },
      {
        id: 'slide-dai-su-movielegend',
        title: 'Đại sứ Trẻ Movie Legend - Khởi Đầu Đột Phá',
        subtitle: 'Lộ trình phát triển chuyên sâu ngành công nghệ máy chiếu và nghe nhìn cao cấp',
        image: '/assets/images/workplace.png',
        tag: 'Gen Z Triển Vọng',
        bgClass: 'bg-white',
        active: true,
        order: 5,
      },
    ];

    try {
      const filePath = this.getCampaignBannersFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      this.logger.error('Failed to read campaign banners from storage:', err);
    }

    try {
      const filePath = this.getCampaignBannersFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultBanners, null, 2), 'utf-8');
    } catch (e) {
      // bỏ qua lỗi khởi tạo
    }

    return defaultBanners;
  }

  async updateCampaignBanners(banners: any[]) {
    if (!Array.isArray(banners)) {
      return this.getCampaignBanners();
    }

    const cleanBanners = banners.map((b: any, idx: number) => ({
      id: String(b?.id || `slide-${Date.now()}-${idx}`),
      title: String(b?.title || '').trim(),
      subtitle: String(b?.subtitle || '').trim(),
      image: String(b?.image || '').trim(),
      tag: String(b?.tag || '').trim(),
      bgClass: String(b?.bgClass || 'bg-white').trim(),
      active: b?.active !== false,
      order: typeof b?.order === 'number' ? b?.order : idx + 1,
    }));

    try {
      const filePath = this.getCampaignBannersFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(cleanBanners, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save campaign banners to storage:', err);
    }

    return cleanBanners;
  }

  // ==========================================
  // HERO BANNER TRANG CHỦ TUYỂN DỤNG
  // ==========================================

  private getHeroBannerFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_hero.json');
  }

  async getHeroBanner() {
    const defaultHero = {
      imageUrl: '/assets/images/hero-banner-jovie.jpg',
      eyebrow: 'Cơ hội việc làm & phát triển nghề nghiệp',
      title: 'Gửi Hồ Sơ & Đón Nhận Công Việc Bạn Mơ Ước!',
      subtitle: 'Cùng Movie Legend kiến tạo không gian điện ảnh đỉnh cao và phát triển sự nghiệp vững chắc ngay hôm nay.',
    };

    try {
      const filePath = this.getHeroBannerFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            imageUrl: String(parsed.imageUrl || defaultHero.imageUrl).trim(),
            eyebrow: String(parsed.eyebrow || defaultHero.eyebrow).trim(),
            title: String(parsed.title || defaultHero.title).trim(),
            subtitle: String(parsed.subtitle || defaultHero.subtitle).trim(),
          };
        }
      }
    } catch (err) {
      this.logger.error('Failed to read hero banner from storage:', err);
    }

    try {
      const filePath = this.getHeroBannerFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultHero, null, 2), 'utf-8');
    } catch (e) {
      // bỏ qua lỗi khởi tạo
    }

    return defaultHero;
  }

  async updateHeroBanner(data: { imageUrl?: string; eyebrow?: string; title?: string; subtitle?: string }) {
    const current = await this.getHeroBanner();
    const updated = {
      imageUrl: data.imageUrl !== undefined ? String(data.imageUrl).trim() : current.imageUrl,
      eyebrow: data.eyebrow !== undefined ? String(data.eyebrow).trim() : current.eyebrow,
      title: data.title !== undefined ? String(data.title).trim() : current.title,
      subtitle: data.subtitle !== undefined ? String(data.subtitle).trim() : current.subtitle,
    };

    try {
      const filePath = this.getHeroBannerFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save hero banner to storage:', err);
    }

    return updated;
  }

  private getDiscoverFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_discover_content.json');
  }

  async getDiscoverContent() {
    const defaultDiscover = {
      hero: {
        imageUrl: '/assets/images/home_about/bannerd2508.png',
        title: 'Không Gian Đỉnh Cao – Văn Hóa Sáng Tạo',
        subtitle: 'Nơi công nghệ quang học và tình yêu điện ảnh cùng thăng hoa.',
      },
      newsEvents: [
        {
          id: 1,
          title: 'Movie Legend Careers – Cùng thổi hồn điện ảnh',
          subtitle: 'Cơ hội làm việc trong môi trường sáng tạo, chuyên nghiệp và đầy cảm hứng.',
          link: 'https://movielegend.vn/tin-tuc/1',
          imageUrl: '/assets/images/home_about/sp_op_3.png',
        },
        {
          id: 2,
          title: 'Hậu Trường Tạo Nên Huyền Thoại',
          subtitle: 'Khám phá những câu chuyện phía sau màn ảnh cùng đội ngũ MovieLegend.',
          link: 'https://movielegend.vn/tin-tuc/2',
          imageUrl: '/assets/images/home_about/sp_op_1.png',
        },
      ],
      featuredJobs: [
        {
          id: 1,
          title: 'Content Creator (Digital Marketing)',
          subtitle: 'Sáng tạo nội dung, đồng hành cùng chiến dịch truyền thông của MovieLegend.',
          link: 'https://movielegend.vn/tuyen-dung/1',
          imageUrl: '/assets/images/cong-nghe.png',
        },
        {
          id: 2,
          title: 'Quay Dựng Phim (Part-time/Full-time)',
          subtitle: 'Tham gia sản xuất các dự án phim ngắn, TVC và nội dung sáng tạo.',
          link: 'https://movielegend.vn/tuyen-dung/2',
          imageUrl: '/assets/images/showcase-fifa-cinema.jpg',
        },
      ],
      amenities: [
        {
          id: 1,
          title: 'Phòng Chiếu 150 Inch Chuẩn Rạp',
          description: 'Trang bị máy chiếu 4K Laser và âm thanh Dolby Atmos 7.1.2 để nhân viên test sản phẩm và xem phim thư giãn cuối tuần.',
          imageUrl: '/assets/images/showcase-fifa-cinema.jpg',
        },
        {
          id: 2,
          title: 'Văn Phòng Mở Không Vách Ngăn',
          description: 'Bàn làm việc nâng hạ công thái học, ánh sáng tự nhiên chan hòa, thúc đẩy tinh thần làm việc nhóm và giao tiếp cởi mở.',
          imageUrl: '/assets/images/workplace.png',
        },
        {
          id: 3,
          title: 'Quầy Cà Phê & Nạp Năng Lượng',
          description: 'Máy pha cà phê hạt nguyên chất, trà hoa quả tươi, bánh ngọt và đồ ăn nhẹ luôn sẵn sàng phục vụ bất cứ lúc nào.',
          imageUrl: '/assets/images/hero-banner-jovie.jpg',
        },
        {
          id: 4,
          title: 'Showroom Trải Nghiệm Flagship',
          description: 'Không gian chuẩn Bắc Âu nơi khách hàng và đối tác trải nghiệm trực tiếp các thiết bị quang học cao cấp nhất.',
          imageUrl: '/assets/images/movie-legend-storefront.png',
        },
      ],
      gallery: [
        {
          id: 1,
          title: 'Đêm Điện Ảnh Camping Dã Ngoại',
          category: 'lifestyle',
          tag: 'Teambuilding',
          image: '/assets/images/home_about/sp_op_3.png',
          desc: 'Khoảnh khắc cả đội ngũ quây quần chiếu phim giữa thiên nhiên thoáng đãng.',
        },
        {
          id: 2,
          title: 'Showroom Trải Nghiệm Flagship',
          category: 'workplace',
          tag: 'Không gian mở',
          image: '/assets/images/movie-legend-storefront.png',
          desc: 'Showroom phong cách tối giản Bắc Âu, nơi đội ngũ tiếp đón khách hàng VIP.',
        },
        {
          id: 3,
          title: 'Phòng Chiếu Thử Nghiệm 4K HDR',
          category: 'cinema',
          tag: 'Phòng Lab Cinema',
          image: '/assets/images/room-living-projector-hdr.png',
          desc: 'Phòng chiếu chuẩn studio 150 inch ngay tại trụ sở để test sản phẩm.',
        },
        {
          id: 4,
          title: 'Studio Cân Chỉnh Quang Học Chuyên Sâu',
          category: 'cinema',
          tag: 'R&D Lab',
          image: '/assets/images/cong-nghe.png',
          desc: 'Nơi các kỹ sư tinh chỉnh từng thấu kính 8 lớp và độ tương phản quang học.',
        },
        {
          id: 5,
          title: 'Góc Cà Phê & Thảo Luận Sáng Tạo',
          category: 'workplace',
          tag: 'Pantry 24/7',
          image: '/assets/images/home_about/sp_op_1.png',
          desc: 'Không gian nạp năng lượng với cà phê specialty và đồ ăn nhẹ tươi mỗi ngày.',
        },
        {
          id: 6,
          title: 'Công Chiếu Phim & Buổi Xem Chung',
          category: 'cinema',
          tag: 'Movie Night',
          image: '/assets/images/room-projection-wall.jpg',
          desc: 'Buổi chiếu phim bom tấn định kỳ dành riêng cho Movie Legenders.',
        },
        {
          id: 7,
          title: 'Trụ Sở Văn Phòng Hiện Đại',
          category: 'workplace',
          tag: 'Trụ sở chính',
          image: '/assets/images/workplace.png',
          desc: 'Tòa nhà văn phòng kính hiện đại, vị trí đắc địa thuận tiện di chuyển.',
        },
        {
          id: 8,
          title: 'Đội Ngũ Trẻ Đam Mê & Nhiệt Huyết',
          category: 'lifestyle',
          tag: 'Movie Legenders',
          image: '/assets/images/kinh-doanh.png',
          desc: 'Những nụ cười rạng rỡ và tinh thần đồng đội gắn kết không khoảng cách.',
        },
      ],
    };

    try {
      const filePath = this.getDiscoverFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...defaultDiscover,
            ...parsed,
            hero: { ...defaultDiscover.hero, ...(parsed.hero || {}) },
            amenities: Array.isArray(parsed.amenities) && parsed.amenities.length > 0 ? parsed.amenities : defaultDiscover.amenities,
            gallery: Array.isArray(parsed.gallery) && parsed.gallery.length > 0 ? parsed.gallery : defaultDiscover.gallery,
          };
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse discover content file, using default');
    }

    try {
      const filePath = this.getDiscoverFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultDiscover, null, 2), 'utf-8');
    } catch (e) {
      // ignore init error
    }

    return defaultDiscover;
  }

  async updateDiscoverContent(data: any) {
    const current = await this.getDiscoverContent();
    const updated = {
      ...current,
      hero: {
        imageUrl: data?.hero?.imageUrl !== undefined ? String(data.hero.imageUrl).trim() : current.hero.imageUrl,
        title: data?.hero?.title !== undefined ? String(data.hero.title).trim() : current.hero.title,
        subtitle: data?.hero?.subtitle !== undefined ? String(data.hero.subtitle).trim() : current.hero.subtitle,
      },
      amenities: Array.isArray(data?.amenities) ? data.amenities : current.amenities,
      gallery: Array.isArray(data?.gallery) ? data.gallery : current.gallery,
      newsEvents: Array.isArray(data?.newsEvents) ? data.newsEvents : (current.newsEvents || []),
      featuredJobs: Array.isArray(data?.featuredJobs) ? data.featuredJobs : (current.featuredJobs || []),
    };

    try {
      const filePath = this.getDiscoverFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save discover content to storage:', err);
    }

    return updated;
  }

  private getAboutFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_about_content.json');
  }

  async getAboutContent() {
    const defaultAbout = {
      hero: {
        imageUrl: '/assets/images/home_about/bannerd2508.png',
        title: 'Hành Trình Kiến Tạo Giấc Mơ Điện Ảnh',
        subtitle: 'Mang chuẩn mực rạp chiếu phim chuyên nghiệp vào từng không gian sống.',
      },
      missionVision: {
        visionImage: '/assets/images/movie-legend-storefront.png',
        visionTag: 'Không gian trải nghiệm Bắc Âu',
        visionTitle: 'Tầm Nhìn Chiến Lược',
        visionDesc: 'Trở thành hệ sinh thái thiết bị quang học và rạp chiếu phim thông minh tại gia số 1 Đông Nam Á. Chúng tôi hướng tới tương lai nơi mọi gia đình đều có thể dễ dàng sở hữu một không gian nghe nhìn đỉnh cao chuẩn studio mà không cần đầu tư những hệ thống rườm rà, đắt đỏ.',
        visionSubtext: 'Dẫn đầu công nghệ quang học tại gia',
        missionImage: '/assets/images/hero-banner-jovie.jpg',
        missionTag: 'Điện ảnh trong từng tổ ấm',
        missionTitle: 'Sứ Mệnh Phụng Sự',
        missionDesc: 'Biến mỗi tối bên gia đình thành một trải nghiệm điện ảnh trọn vẹn cảm xúc. Chúng tôi cam kết không ngừng đổi mới về công nghệ, nâng cao độ tinh xảo trong chế tác và đem lại sự an tâm tuyệt đối bằng chế độ bảo hành chuyên nghiệp và tận tâm nhất.',
        missionSubtext: 'Trải nghiệm vượt trên kỳ vọng',
      },
      milestones: [
        {
          year: 'Năm 2020',
          title: 'Khởi Đầu Với Niềm Đam Mê Quang Học',
          description: 'Thành lập Movie Legend Lab tại Hà Nội, tập trung nghiên cứu giải pháp máy chiếu LED kích thước nhỏ gọn nhưng đạt độ sắc nét cao dành cho các căn hộ trẻ.',
          imageUrl: '/assets/images/home_about/sp_op_2.png',
        },
        {
          year: 'Năm 2022',
          title: 'Định Hình Chuỗi K-Series & Khai Trương Showroom Đầu Tiên',
          description: 'Ra mắt máy chiếu K-Series với hệ điều hành thông minh tùy biến, đồng thời khai trương Showroom trải nghiệm phòng chiếu thực tế đầu tiên tại Hà Nội, thu hút hàng ngàn lượt khách tham quan.',
          imageUrl: '/assets/images/movie-legend-storefront.png',
        },
        {
          year: 'Năm 2024',
          title: 'Đột Phá Màn Quang Học ALR Chống Chói 93% & Loa Dolby Atmos',
          description: 'Tự hào giới thiệu dòng màn chiếu chuyên dụng ALR khử ánh sáng môi trường kết hợp loa Dolby Atmos, giúp người dùng thoải mái xem phim chất lượng cao ngay cả trong phòng khách bật đèn sáng.',
          imageUrl: '/assets/images/room-projection-wall.jpg',
        },
        {
          year: 'Năm 2025',
          title: 'Mở Rộng Chi Nhánh TP.HCM & Đà Nẵng',
          description: 'Chính thức khai trương văn phòng và showroom tại TP. Hồ Chí Minh & Đà Nẵng; cán mốc phục vụ hơn 15,000+ phòng khách gia đình và hàng trăm dự án villa, resort nghỉ dưỡng cao cấp trên toàn quốc.',
          imageUrl: '/assets/images/showcase-fifa-cinema.jpg',
        },
        {
          year: 'Năm 2026 - Hiện tại',
          title: 'Thế Hệ Máy Chiếu Laser 4K H8Pro Max - V2 & Tuyển Dụng Nhân Tài',
          description: 'Nâng tầm hệ sinh thái toàn diện với dòng Flagship H8Pro Max - V2, mở rộng quy mô nhân sự với hơn 28+ vị trí chiến lược để đưa sản phẩm vươn tầm khu vực Đông Nam Á.',
          imageUrl: '/assets/images/home_about/bannerd2508.png',
        },
      ],
      pillarsSection: {
        eyebrow: 'Hệ sinh thái sản phẩm',
        title: 'Giải Pháp Trọn Gói Rạp Phim Tại Gia',
        subtitle: 'Sự phối hợp hoàn hảo giữa các trụ cột thiết bị mang đến chất lượng hiển thị chuẩn rạp thương mại.',
      },
      pillars: [
        {
          title: 'Máy Chiếu Laser & 4K',
          description: 'Dòng Flagship H8Pro Max - V2, K9 CineLux với thấu kính 8 lớp chống méo viền, tự động lấy nét và căn khung hình bằng AI thông minh.',
          imageUrl: '/assets/images/home_about/sp_op_1.png',
        },
        {
          title: 'Màn Quang Học ALR',
          description: 'Cấu trúc vi mô triệt tiêu 93% ánh sáng tạp từ trần nhà và môi trường, đem lại độ tương phản vô tận và màu đen sâu thẳm chuẩn HDR.',
          imageUrl: '/assets/images/room-projection-wall.jpg',
        },
        {
          title: 'Âm Thanh Dolby Atmos',
          description: 'Soundbar đa kênh tích hợp loa Subwoofer siêu trầm, tái tạo dải âm không gian 3D sống động như đang ngồi tại rạp chiếu IMAX.',
          imageUrl: '/assets/images/room-living-projector-hdr.png',
        },
        {
          title: 'Thi Công & Phụ Kiện',
          description: 'Chân đế xoay 360°, giá treo trần giấu dây tự động, hỗ trợ nhà thông minh Smart Home và dịch vụ lắp đặt tận nơi chuyên nghiệp.',
          imageUrl: '/assets/images/showcase-fifa-cinema.jpg',
        },
      ],
      showcasesSection: {
        eyebrow: 'Showcase rạp phim tại gia',
        title: 'Từ Bản Vẽ Đến Không Gian Thực Tế',
        subtitle: 'Hơn 15,000+ phòng khách và căn hộ cao cấp đã tin tưởng đồng hành cùng Movie Legend.',
      },
      showcases: [
        {
          tag: 'Penthouse Master',
          title: 'Rạp Chiếu 150" Màn ALR Quang Học',
          imageUrl: '/assets/images/room-living-projector-hdr.png',
        },
        {
          tag: 'Căn Hộ Cao Cấp',
          title: 'Không Gian Chiếu Phim Phòng Ngủ',
          imageUrl: '/assets/images/home_about/sp_op_2.png',
        },
        {
          tag: 'Villa & Dã Ngoại',
          title: 'Rạp Chiếu Phim Ngoài Trời Dã Ngoại',
          imageUrl: '/assets/images/home_about/sp_op_3.png',
        },
      ],
    };

    try {
      const filePath = this.getAboutFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...defaultAbout,
            ...parsed,
            hero: { ...defaultAbout.hero, ...(parsed.hero || {}) },
            missionVision: { ...defaultAbout.missionVision, ...(parsed.missionVision || {}) },
            milestones: Array.isArray(parsed.milestones) && parsed.milestones.length > 0 ? parsed.milestones : defaultAbout.milestones,
            pillarsSection: { ...defaultAbout.pillarsSection, ...(parsed.pillarsSection || {}) },
            pillars: Array.isArray(parsed.pillars) && parsed.pillars.length > 0 ? parsed.pillars : defaultAbout.pillars,
            showcasesSection: { ...defaultAbout.showcasesSection, ...(parsed.showcasesSection || {}) },
            showcases: Array.isArray(parsed.showcases) && parsed.showcases.length > 0 ? parsed.showcases : defaultAbout.showcases,
          };
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse about content file, using default');
    }

    try {
      const filePath = this.getAboutFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultAbout, null, 2), 'utf-8');
    } catch (e) {
      // ignore init error
    }

    return defaultAbout;
  }

  async updateAboutContent(data: any) {
    const current = await this.getAboutContent();
    const updated = {
      ...current,
      hero: {
        imageUrl: data?.hero?.imageUrl !== undefined ? String(data.hero.imageUrl).trim() : current.hero.imageUrl,
        title: data?.hero?.title !== undefined ? String(data.hero.title).trim() : current.hero.title,
        subtitle: data?.hero?.subtitle !== undefined ? String(data.hero.subtitle).trim() : current.hero.subtitle,
      },
      missionVision: {
        visionImage: data?.missionVision?.visionImage !== undefined ? String(data.missionVision.visionImage).trim() : current.missionVision.visionImage,
        visionTag: data?.missionVision?.visionTag !== undefined ? String(data.missionVision.visionTag).trim() : current.missionVision.visionTag,
        visionTitle: data?.missionVision?.visionTitle !== undefined ? String(data.missionVision.visionTitle).trim() : current.missionVision.visionTitle,
        visionDesc: data?.missionVision?.visionDesc !== undefined ? String(data.missionVision.visionDesc).trim() : current.missionVision.visionDesc,
        visionSubtext: data?.missionVision?.visionSubtext !== undefined ? String(data.missionVision.visionSubtext).trim() : current.missionVision.visionSubtext,
        missionImage: data?.missionVision?.missionImage !== undefined ? String(data.missionVision.missionImage).trim() : current.missionVision.missionImage,
        missionTag: data?.missionVision?.missionTag !== undefined ? String(data.missionVision.missionTag).trim() : current.missionVision.missionTag,
        missionTitle: data?.missionVision?.missionTitle !== undefined ? String(data.missionVision.missionTitle).trim() : current.missionVision.missionTitle,
        missionDesc: data?.missionVision?.missionDesc !== undefined ? String(data.missionVision.missionDesc).trim() : current.missionVision.missionDesc,
        missionSubtext: data?.missionVision?.missionSubtext !== undefined ? String(data.missionVision.missionSubtext).trim() : current.missionVision.missionSubtext,
      },
      milestones: Array.isArray(data?.milestones) ? data.milestones : current.milestones,
      pillarsSection: {
        eyebrow: data?.pillarsSection?.eyebrow !== undefined ? String(data.pillarsSection.eyebrow).trim() : (current.pillarsSection?.eyebrow || 'Hệ sinh thái sản phẩm'),
        title: data?.pillarsSection?.title !== undefined ? String(data.pillarsSection.title).trim() : (current.pillarsSection?.title || 'Giải Pháp Trọn Gói Rạp Phim Tại Gia'),
        subtitle: data?.pillarsSection?.subtitle !== undefined ? String(data.pillarsSection.subtitle).trim() : (current.pillarsSection?.subtitle || 'Sự phối hợp hoàn hảo giữa các trụ cột thiết bị mang đến chất lượng hiển thị chuẩn rạp thương mại.'),
      },
      pillars: Array.isArray(data?.pillars) ? data.pillars : current.pillars,
      showcasesSection: {
        eyebrow: data?.showcasesSection?.eyebrow !== undefined ? String(data.showcasesSection.eyebrow).trim() : (current.showcasesSection?.eyebrow || 'Showcase rạp phim tại gia'),
        title: data?.showcasesSection?.title !== undefined ? String(data.showcasesSection.title).trim() : (current.showcasesSection?.title || 'Từ Bản Vẽ Đến Không Gian Thực Tế'),
        subtitle: data?.showcasesSection?.subtitle !== undefined ? String(data.showcasesSection.subtitle).trim() : (current.showcasesSection?.subtitle || 'Hơn 15,000+ phòng khách và căn hộ cao cấp đã tin tưởng đồng hành cùng Movie Legend.'),
      },
      showcases: Array.isArray(data?.showcases) ? data.showcases : current.showcases,
    };

    try {
      const filePath = this.getAboutFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save about content to storage:', err);
    }

    return updated;
  }

  private getShowroomsFilePath(): string {
    return path.resolve(process.cwd(), 'storage', 'recruitment_showrooms.json');
  }

  /**
   * Lấy danh sách toàn bộ Showroom / Cơ sở Movie Legend
   */
  async getShowrooms() {
    try {
      const filePath = this.getShowroomsFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      this.logger.error('Failed to read showrooms from storage:', err);
    }
    return [];
  }

  /**
   * Tạo mới hoặc cập nhật cơ sở Showroom
   */
  async createShowroom(dto: CreateShowroomDto) {
    const list = await this.getShowrooms();
    const cleanCode = dto.code.trim().toUpperCase();

    const existingIndex = list.findIndex((s: any) => s.code.toUpperCase() === cleanCode);

    const lng = dto.longitude !== undefined && !isNaN(Number(dto.longitude)) ? Number(dto.longitude) : 105.8371;
    const lat = dto.latitude !== undefined && !isNaN(Number(dto.latitude)) ? Number(dto.latitude) : 21.0225;

    const newShowroom = {
      id: cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      code: cleanCode,
      name: dto.name.trim(),
      region: dto.region?.trim() || dto.city.trim(),
      district: dto.district.trim(),
      city: dto.city.trim(),
      address: dto.address.trim(),
      hotline: dto.hotline?.trim() || '03594.66666',
      hours: dto.hours?.trim() || '08:30 – 21:30 (Cả T7, CN)',
      highlight: dto.highlight?.trim() || `Showroom trải nghiệm Movie Legend tại ${dto.district}, ${dto.city}`,
      features: dto.features && dto.features.length > 0 ? dto.features : [
        'Trưng bày đầy đủ các dòng máy chiếu gia đình & Laser TV',
        'Phòng demo ánh sáng thực tế & hỗ trợ kỹ thuật tận tình',
      ],
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(dto.address.trim())}`,
      geoCoordinates: [lng, lat] as [number, number],
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newShowroom };
    } else {
      list.push(newShowroom);
    }

    try {
      const filePath = this.getShowroomsFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save showroom to file:', err);
    }

    // Showroom tuyển dụng chỉ lưu trong file JSON riêng — không tạo chi nhánh HR

    return newShowroom;
  }

  /**
   * Xoá cơ sở Showroom theo ID hoặc Code (CS1 được khoá cứng vĩnh viễn)
   */
  async deleteShowroom(idOrCode: string) {
    const clean = idOrCode.trim().toLowerCase();
    if (clean === 'cs1' || clean === 'cn_dong_da' || clean === 'cn_van_chuong') {
      throw badRequest('CANNOT_DELETE_CS1', 'Cơ sở CS1 (Đống Đa - Trụ sở chính) là cơ sở trung tâm được khoá cứng vĩnh viễn, không thể xoá!');
    }

    const list = await this.getShowrooms();
    const target = list.find((s: any) => s.id?.toLowerCase() === clean || s.code?.toLowerCase() === clean);
    if (target && (target.code?.toUpperCase() === 'CS1' || target.name?.toLowerCase().includes('đống đa') || target.name?.toLowerCase().includes('văn chương'))) {
      throw badRequest('CANNOT_DELETE_CS1', 'Cơ sở CS1 (Đống Đa - Trụ sở chính) là cơ sở trung tâm được khoá cứng vĩnh viễn, không thể xoá!');
    }

    const updated = list.filter((s: any) => 
      s.id.toLowerCase() !== clean && s.code.toLowerCase() !== clean
    );

    const filePath = this.getShowroomsFilePath();
    try {
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to update showrooms file after deletion:', err);
    }

    // Không xoá branch HR — showroom tuyển dụng độc lập với bảng branches

    return { success: true, message: `Đã xoá cơ sở ${idOrCode}` };
  }

  /**
   * Ứng viên nộp hồ sơ ứng tuyển kèm file CV
   */
  async submitApplication(dto: ApplyJobDto, file?: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    const job = await this.prisma.jobPosting.findFirst({
      where: {
        OR: [{ id: dto.jobId }, { newCode: dto.jobId }],
        deletedAt: null,
      },
    });

    if (!job || job.deletedAt) {
      throw notFound('JOB_NOT_FOUND', 'Vị trí tuyển dụng không tồn tại hoặc đã hết hạn');
    }

    let cvFileUrl = dto.cvFileUrl;
    let cvFileName = dto.cvFileName;
    let cvFileSize = dto.cvFileSize;

    // Nếu có upload file CV dạng buffer (từ multipart request)
    if (file) {
      try {
        const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'pdf';
        const storageKey = `cv/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
        const uploadResult = await this.mediaStorage.upload({
          buffer: file.buffer,
          fileName: file.originalname,
          mimeType: file.mimetype,
          storageKey,
        });
        cvFileUrl = uploadResult.fileUrl;
        cvFileName = file.originalname;
        cvFileSize = file.size;
      } catch (err: any) {
        this.logger.warn(`Lỗi lưu file CV qua mediaStorage, lưu fallback metadata: ${err.message}`);
        cvFileName = file.originalname;
        cvFileSize = file.size;
      }
    }

    const applicationCode = `APP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Tự động tính toán điểm phù hợp của ứng viên với JD
    const matchAnalysis = calculateCandidateMatchScore(
      {
        skills: dto.skills,
        note: dto.note,
        major: dto.major,
        city: dto.city,
        educationLevel: dto.educationLevel,
        university: dto.university,
        experienceYears: dto.experienceYears,
        cvFileUrl,
        phone: dto.phone,
        email: dto.email,
        currentCompany: dto.currentCompany,
      },
      job,
    );

    const application = await this.prisma.jobApplication.create({
      data: {
        applicationCode,
        jobId: job.id,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        dob: dto.dob,
        gender: dto.gender,
        city: dto.city,
        educationLevel: dto.educationLevel,
        university: dto.university,
        major: dto.major,
        experienceYears: dto.experienceYears,
        currentCompany: dto.currentCompany,
        skills: dto.skills,
        note: dto.note,
        cvFileUrl: cvFileUrl || null,
        cvFileName: cvFileName || null,
        cvFileSize: cvFileSize || null,
        status: ApplicationStatus.SUBMITTED,
        aiCvScore: matchAnalysis.score,
        aiSummary: matchAnalysis.summary,
      },
    });

    // Tăng số lượng hồ sơ đã ứng tuyển trên tin tuyển dụng
    this.prisma.jobPosting
      .update({
        where: { id: job.id },
        data: { applyCount: { increment: 1 } },
      })
      .catch((err) => this.logger.warn(`Lỗi tăng applyCount: ${err.message}`));

    // Gửi thông báo realtime qua Socket & In-app Notification cho HR
    this.sendNewApplicationNotification(application, job).catch((err) =>
      this.logger.warn(`Lỗi gửi thông báo nộp CV qua Socket: ${err.message}`),
    );

    // Gửi email xác nhận nộp CV và hồ sơ ứng tuyển thành công cho ứng viên
    if (application.email) {
      this.emailService
        .sendApplicationConfirmationEmail(application.email, {
          fullName: application.fullName,
          jobTitle: job.name,
          applicationCode: application.applicationCode,
          phone: application.phone,
          cvFileName: application.cvFileName || undefined,
        })
        .catch((err) =>
          this.logger.warn(`Lỗi gửi email xác nhận cho ứng viên ${application.email}: ${err.message}`),
        );
    }

    return {
      success: true,
      message: 'Hồ sơ của bạn đã được gửi thành công đến bộ phận Tuyển dụng Movie Legend!',
      applicationId: application.applicationCode,
      id: application.id,
    };
  }

  // ==========================================
  // ADMIN HR METHODS (Dành cho movielegend-hrm-web)
  // ==========================================

  /**
   * HR xem tất cả các tin tuyển dụng (bao gồm DRAFT, PUBLISHED, CLOSED)
   */
  async adminGetJobs(query: { keyword?: string; status?: JobStatus; departmentName?: string; page?: number; size?: number }) {
    const page = Math.max(0, Number(query.page || 0));
    const size = Math.max(1, Math.min(100, Number(query.size || 20)));
    const skip = page * size;

    const where: Prisma.JobPostingWhereInput = {
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.departmentName) where.departmentName = { contains: query.departmentName, mode: 'insensitive' };
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { newCode: { contains: query.keyword, mode: 'insensitive' } },
        { departmentName: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((job) => ({
        ...job,
        branchName: job.regionName || job.province,
        toDate: formatToDateString(job.toDate),
        totalApplications: job._count.applications,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * HR tạo mới tin tuyển dụng
   */
  async adminCreateJob(dto: CreateJobDto, hrUserId?: string) {
    const toDate = parseToDate(dto.toDate);
    const newCode = `ML-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const job = await this.prisma.jobPosting.create({
      data: {
        newCode,
        name: dto.name.trim(),
        departmentName: dto.departmentName.trim(),
        rankName: dto.rankName?.trim() || null,
        province: dto.province.trim(),
        regionCode: dto.regionCode || null,
        regionName: dto.branchName || dto.regionName || null,
        experienceRequired: dto.experienceRequired || null,
        toDate,
        salary: dto.salary || null,
        missionContent: dto.missionContent || null,
        welfare: dto.welfare || null,
        jobDescriptionVn: dto.jobDescriptionVn || null,
        jobDescriptionEn: dto.jobDescriptionEn || null,
        skillTags: dto.skillTags || [],
        level: dto.level || [],
        status: dto.status || JobStatus.PUBLISHED,
        createdByHrId: hrUserId || null,
      },
    });

    return {
      ...job,
      branchName: job.regionName || job.province,
      toDate: formatToDateString(job.toDate),
    };
  }

  /**
   * HR cập nhật tin tuyển dụng
   */
  async adminUpdateJob(id: string, dto: UpdateJobDto) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw notFound('JOB_NOT_FOUND', 'Không tìm thấy tin tuyển dụng');
    }

    const data: Prisma.JobPostingUpdateInput = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.departmentName) data.departmentName = dto.departmentName.trim();
    if (dto.rankName !== undefined) data.rankName = dto.rankName?.trim() || null;
    if (dto.province) data.province = dto.province.trim();
    if (dto.regionCode !== undefined) data.regionCode = dto.regionCode;
    if (dto.regionName !== undefined || dto.branchName !== undefined) {
      data.regionName = dto.branchName || dto.regionName || null;
    }
    if (dto.experienceRequired !== undefined) data.experienceRequired = dto.experienceRequired;
    if (dto.toDate) data.toDate = parseToDate(dto.toDate);
    if (dto.salary !== undefined) data.salary = dto.salary;
    if (dto.missionContent !== undefined) data.missionContent = dto.missionContent;
    if (dto.welfare !== undefined) data.welfare = dto.welfare;
    if (dto.jobDescriptionVn !== undefined) data.jobDescriptionVn = dto.jobDescriptionVn;
    if (dto.jobDescriptionEn !== undefined) data.jobDescriptionEn = dto.jobDescriptionEn;
    if (dto.skillTags !== undefined) data.skillTags = dto.skillTags;
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.jobPosting.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      branchName: updated.regionName || updated.province,
      toDate: formatToDateString(updated.toDate),
    };
  }

  /**
   * HR xóa tin tuyển dụng (soft delete)
   */
  async adminDeleteJob(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw notFound('JOB_NOT_FOUND', 'Không tìm thấy tin tuyển dụng');

    await this.prisma.jobPosting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: JobStatus.CLOSED,
      },
    });

    return { success: true, message: 'Đã xóa tin tuyển dụng thành công' };
  }

  /**
   * HR xem danh sách hồ sơ ứng viên
   */
  async adminGetApplications(query: {
    jobId?: string;
    status?: ApplicationStatus;
    keyword?: string;
    page?: number;
    size?: number;
  }) {
    const page = Math.max(0, Number(query.page || 0));
    const size = Math.max(1, Math.min(100, Number(query.size || 20)));
    const skip = page * size;

    const where: Prisma.JobApplicationWhereInput = {};
    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;
    if (query.keyword?.trim()) {
      const kw = query.keyword.trim();
      where.OR = [
        { fullName: { contains: kw, mode: 'insensitive' } },
        { email: { contains: kw, mode: 'insensitive' } },
        { phone: { contains: kw, mode: 'insensitive' } },
        { applicationCode: { contains: kw, mode: 'insensitive' } },
        { university: { contains: kw, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              name: true,
              newCode: true,
              departmentName: true,
              rankName: true,
              province: true,
              regionName: true,
              regionCode: true,
              experienceRequired: true,
              salary: true,
              missionContent: true,
              jobDescriptionVn: true,
              skillTags: true,
              level: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Đếm tổng số lần ứng tuyển của từng ứng viên trong hệ thống
    const emails = Array.from(new Set(items.map((i) => i.email.toLowerCase()).filter(Boolean)));
    const phones = Array.from(new Set(items.map((i) => i.phone.trim()).filter(Boolean)));

    const [countByEmail, countByPhone] = await Promise.all([
      emails.length > 0
        ? this.prisma.jobApplication.groupBy({
            by: ['email'],
            where: { email: { in: emails } },
            _count: { id: true },
          })
        : [],
      phones.length > 0
        ? this.prisma.jobApplication.groupBy({
            by: ['phone'],
            where: { phone: { in: phones } },
            _count: { id: true },
          })
        : [],
    ]);

    const countMap = new Map<string, number>();
    countByEmail.forEach((c) => countMap.set(`email:${c.email.toLowerCase()}`, c._count.id));
    countByPhone.forEach((c) => countMap.set(`phone:${c.phone}`, c._count.id));

    const enrichedItems = items.map((item) => {
      const emailCount = countMap.get(`email:${item.email.toLowerCase()}`) || 1;
      const phoneCount = countMap.get(`phone:${item.phone}`) || 1;
      const totalApps = Math.max(emailCount, phoneCount);
      const matchAnalysis = calculateCandidateMatchScore(item, item.job);
      const finalScore = typeof item.aiCvScore === 'number' && item.aiCvScore > 0 ? item.aiCvScore : matchAnalysis.score;
      const finalSummary = item.aiSummary || matchAnalysis.summary;

      return {
        ...item,
        aiCvScore: finalScore,
        aiSummary: finalSummary,
        matchScore: finalScore,
        matchTier: matchAnalysis.tier,
        matchTierLabel: matchAnalysis.tierLabel,
        matchedTags: matchAnalysis.matchedTags,
        missingTags: matchAnalysis.missingTags,
        candidateTotalApplications: totalApps,
      };
    });

    return {
      items: enrichedItems,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * HR xem chi tiết lịch sử ứng tuyển của 1 ứng viên
   */
  async getCandidateApplicationHistory(email?: string, phone?: string) {
    if (!email?.trim() && !phone?.trim()) {
      return { total: 0, candidate: null, items: [] };
    }

    const whereOr: Prisma.JobApplicationWhereInput[] = [];
    if (email?.trim()) {
      whereOr.push({ email: { equals: email.trim(), mode: 'insensitive' } });
    }
    if (phone?.trim()) {
      whereOr.push({ phone: phone.trim() });
    }

    const items = await this.prisma.jobApplication.findMany({
      where: { OR: whereOr },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            newCode: true,
            departmentName: true,
            province: true,
            regionName: true,
            regionCode: true,
            status: true,
          },
        },
      },
    });

    return {
      total: items.length,
      candidate: items[0]
        ? {
            fullName: items[0].fullName,
            email: items[0].email,
            phone: items[0].phone,
            city: items[0].city,
            university: items[0].university,
            major: items[0].major,
            experienceYears: items[0].experienceYears,
          }
        : null,
      items,
    };
  }

  /**
   * HR xem chi tiết 1 hồ sơ ứng viên
   */
  async adminGetApplicationDetail(id: string) {
    const app = await this.prisma.jobApplication.findFirst({
      where: {
        OR: [{ id }, { applicationCode: id }],
      },
      include: {
        job: true,
      },
    });

    if (!app) {
      throw notFound('APPLICATION_NOT_FOUND', 'Không tìm thấy hồ sơ ứng viên');
    }

    const matchAnalysis = calculateCandidateMatchScore(app, app.job);
    const finalScore = typeof app.aiCvScore === 'number' && app.aiCvScore > 0 ? app.aiCvScore : matchAnalysis.score;
    const finalSummary = app.aiSummary || matchAnalysis.summary;

    return {
      ...app,
      aiCvScore: finalScore,
      aiSummary: finalSummary,
      matchScore: finalScore,
      matchTier: matchAnalysis.tier,
      matchTierLabel: matchAnalysis.tierLabel,
      matchedTags: matchAnalysis.matchedTags,
      missingTags: matchAnalysis.missingTags,
    };
  }

  /**
   * HR cập nhật trạng thái hồ sơ ứng viên, ghi chú phỏng vấn, lịch hẹn
   */
  async adminUpdateApplication(id: string, dto: UpdateApplicationDto, hrUserId?: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) {
      throw notFound('APPLICATION_NOT_FOUND', 'Không tìm thấy hồ sơ ứng viên');
    }

    const data: Prisma.JobApplicationUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.hrNotes !== undefined) data.hrNotes = dto.hrNotes;
    if (dto.interviewDate !== undefined) {
      data.interviewDate = dto.interviewDate ? new Date(dto.interviewDate) : null;
    }
    if (dto.rejectionReason !== undefined) data.rejectionReason = dto.rejectionReason;
    if (dto.aiCvScore !== undefined) data.aiCvScore = dto.aiCvScore;
    if (dto.aiSummary !== undefined) data.aiSummary = dto.aiSummary;
    if (hrUserId) data.reviewedByHrId = hrUserId;

    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data,
      include: { job: true },
    });

    // Nếu có cập nhật lịch phỏng vấn hoặc trạng thái chuyển sang INTERVIEW
    if (
      (dto.interviewDate && updated.interviewDate) ||
      (dto.status === ApplicationStatus.INTERVIEW && updated.interviewDate)
    ) {
      this.sendInterviewScheduledNotification(updated).catch((err) =>
        this.logger.warn(`Lỗi gửi thông báo lịch phỏng vấn: ${err.message}`),
      );

      // Gửi email mời phỏng vấn cho ứng viên
      if (updated.email) {
        this.emailService
          .sendInterviewInvitationEmail(updated.email, {
            fullName: updated.fullName,
            jobTitle: updated.job?.name || 'Vị trí tuyển dụng',
            applicationCode: updated.applicationCode,
            interviewDateStr: formatDateTimeVn(new Date(updated.interviewDate)),
            note: updated.hrNotes || undefined,
          })
          .catch((err) =>
            this.logger.warn(`Lỗi gửi email mời phỏng vấn cho ứng viên ${updated.email}: ${err.message}`),
          );
      }
    }

    return updated;
  }

  // ==========================================
  // REALTIME SOCKET & THÔNG BÁO HR
  // ==========================================

  /**
   * Lấy danh sách ID của các tài khoản HR và Admin đang hoạt động để gửi thông báo
   */
  private async getHrAndAdminUserIds(): Promise<string[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              roles: {
                some: {
                  role: {
                    code: { in: ['HR', 'ADMIN', 'SUPER_ADMIN', 'RECRUITER'] },
                  },
                },
              },
            },
            {
              departmentLinks: {
                some: {
                  department: {
                    name: { contains: 'Nhân sự', mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (users.length > 0) {
        return users.map((u) => u.id);
      }

      // Fallback: nếu chưa có phân quyền HR riêng, gửi cho các tài khoản ADMIN/User
      const admins = await this.prisma.user.findMany({
        where: { deletedAt: null },
        take: 10,
        select: { id: true },
      });
      return admins.map((u) => u.id);
    } catch (err: any) {
      this.logger.warn(`Lỗi tìm user HR/Admin: ${err.message}`);
      return [];
    }
  }

  /**
   * Bắn Socket Realtime và tạo thông báo In-app khi có ứng viên nộp CV
   */
  private async sendNewApplicationNotification(application: any, job: any) {
    const hrUserIds = await this.getHrAndAdminUserIds();

    const eventPayload = {
      type: 'recruitment:new_application',
      applicationId: application.id,
      applicationCode: application.applicationCode,
      jobId: job.id,
      jobName: job.name,
      candidateName: application.fullName,
      email: application.email,
      phone: application.phone,
      experienceYears: application.experienceYears,
      educationLevel: application.educationLevel,
      createdAt: application.createdAt,
      title: 'Ứng viên mới nộp hồ sơ',
      message: `Ứng viên ${application.fullName} vừa nộp hồ sơ ứng tuyển vị trí "${job.name}".`,
    };

    // Bắn realtime Socket tới toàn công ty và room tuyển dụng
    this.realtime.emitToRoom('company', 'recruitment:new_application', eventPayload);
    this.realtime.emitToRoom('recruitment', 'recruitment:new_application', eventPayload);

    // Tạo In-app Notification và Push Mobile cho HR/Admin
    if (hrUserIds.length > 0) {
      const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
        type: NotificationType.SYSTEM,
        title: 'Ứng viên mới nộp hồ sơ',
        body: `Ứng viên ${application.fullName} vừa nộp hồ sơ ứng tuyển vị trí "${job.name}".`,
        metadata: {
          type: 'RECRUITMENT_APPLICATION',
          applicationId: application.id,
          applicationCode: application.applicationCode,
          jobId: job.id,
          jobName: job.name,
          candidateName: application.fullName,
          targetUrl: '/recruitment',
        },
      });

      if (notifData) {
        this.notificationsService.emitCreated(notifData);
      }
    }
  }

  /**
   * Bắn Socket Realtime và tạo thông báo In-app khi lên lịch phỏng vấn
   */
  private async sendInterviewScheduledNotification(application: any) {
    const interviewDate = application.interviewDate ? new Date(application.interviewDate) : null;
    if (!interviewDate) return;

    const timeFormatted = formatDateTimeVn(interviewDate);

    const eventPayload = {
      type: 'recruitment:interview_scheduled',
      applicationId: application.id,
      applicationCode: application.applicationCode,
      jobId: application.jobId,
      jobName: application.job?.name || 'Vị trí tuyển dụng',
      candidateName: application.fullName,
      interviewDate: application.interviewDate,
      interviewDateFormatted: timeFormatted,
      title: 'Đã lên lịch phỏng vấn',
      message: `Lịch phỏng vấn ứng viên ${application.fullName} (${application.job?.name || ''}) đã được lên lịch vào lúc ${timeFormatted}.`,
    };

    this.realtime.emitToRoom('company', 'recruitment:interview_scheduled', eventPayload);
    this.realtime.emitToRoom('recruitment', 'recruitment:interview_scheduled', eventPayload);

    const hrUserIds = await this.getHrAndAdminUserIds();
    if (hrUserIds.length > 0) {
      const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
        type: NotificationType.SYSTEM,
        title: 'Lịch hẹn phỏng vấn',
        body: `Ứng viên ${application.fullName} (${application.job?.name || ''}) được xếp lịch phỏng vấn lúc ${timeFormatted}.`,
        metadata: {
          type: 'RECRUITMENT_INTERVIEW',
          applicationId: application.id,
          applicationCode: application.applicationCode,
          jobId: application.jobId,
          interviewDate: application.interviewDate,
          targetUrl: '/recruitment',
        },
      });

      if (notifData) {
        this.notificationsService.emitCreated(notifData);
      }
    }
  }

  /**
   * Cron Job quét định kỳ mỗi 2 phút: Tự động nhắc nhở lịch phỏng vấn sắp diễn ra (trong vòng 45 phút tới)
   */
  @Cron('*/2 * * * *')
  async checkUpcomingInterviews() {
    try {
      const now = new Date();
      // Quét các buổi phỏng vấn trong vòng 45 phút tới
      const lookAheadTime = new Date(now.getTime() + 45 * 60000);

      const upcomingInterviews = await this.prisma.jobApplication.findMany({
        where: {
          status: ApplicationStatus.INTERVIEW,
          interviewDate: {
            gte: now,
            lte: lookAheadTime,
          },
        },
        include: {
          job: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!upcomingInterviews.length) return;

      const hrUserIds = await this.getHrAndAdminUserIds();

      for (const app of upcomingInterviews) {
        if (!app.interviewDate) continue;

        // Dedup key theo từng mốc giờ phỏng vấn để không gửi trùng lặp
        const dateKey = new Date(app.interviewDate).toISOString().slice(0, 16);
        const dedupKey = `interview-reminder:${app.id}:${dateKey}`;

        const existingNotif = await this.prisma.notification.findFirst({
          where: { dedupKey },
        });

        if (existingNotif) continue;

        const timeFormatted = formatDateTimeVn(new Date(app.interviewDate));

        const eventPayload = {
          type: 'recruitment:interview_reminder',
          applicationId: app.id,
          applicationCode: app.applicationCode,
          candidateName: app.fullName,
          jobName: app.job?.name || '',
          interviewDate: app.interviewDate,
          interviewDateFormatted: timeFormatted,
          title: 'Nhắc lịch phỏng vấn sắp diễn ra',
          message: `Sắp đến giờ phỏng vấn ứng viên ${app.fullName} cho vị trí "${app.job?.name || ''}" lúc ${timeFormatted}.`,
        };

        this.logger.log(`[Socket] Gửi nhắc lịch phỏng vấn ứng viên ${app.fullName} lúc ${timeFormatted}`);

        this.realtime.emitToRoom('company', 'recruitment:interview_reminder', eventPayload);
        this.realtime.emitToRoom('recruitment', 'recruitment:interview_reminder', eventPayload);

        if (hrUserIds.length > 0) {
          const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
            type: NotificationType.SYSTEM,
            title: 'Nhắc lịch phỏng vấn',
            body: `Sắp đến giờ phỏng vấn ứng viên ${app.fullName} (${app.job?.name || ''}) lúc ${timeFormatted}.`,
            dedupKey,
            metadata: {
              type: 'RECRUITMENT_INTERVIEW_REMINDER',
              applicationId: app.id,
              applicationCode: app.applicationCode,
              interviewDate: app.interviewDate,
              targetUrl: '/recruitment',
            },
          });

          if (notifData) {
            this.notificationsService.emitCreated(notifData);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Lỗi cron quét nhắc lịch phỏng vấn: ${err.message}`);
    }
  }

  /**
   * HR chủ động bấm nút gửi nhắc nhở lịch phỏng vấn ứng viên ngay lập tức
   */
  async manualInterviewReminder(id: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!app) {
      throw notFound('APPLICATION_NOT_FOUND', 'Không tìm thấy hồ sơ ứng viên');
    }

    if (!app.interviewDate) {
      throw badRequest('INTERVIEW_DATE_NOT_SET', 'Hồ sơ này chưa được đặt ngày & giờ phỏng vấn');
    }

    const timeFormatted = formatDateTimeVn(new Date(app.interviewDate));

    const eventPayload = {
      type: 'recruitment:interview_reminder',
      applicationId: app.id,
      applicationCode: app.applicationCode,
      candidateName: app.fullName,
      jobName: app.job?.name || '',
      interviewDate: app.interviewDate,
      interviewDateFormatted: timeFormatted,
      title: 'Nhắc lịch phỏng vấn',
      message: `Nhắc lịch phỏng vấn ứng viên ${app.fullName} (${app.job?.name || ''}) vào lúc ${timeFormatted}.`,
    };

    this.realtime.emitToRoom('company', 'recruitment:interview_reminder', eventPayload);
    this.realtime.emitToRoom('recruitment', 'recruitment:interview_reminder', eventPayload);

    const hrUserIds = await this.getHrAndAdminUserIds();
    if (hrUserIds.length > 0) {
      const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
        type: NotificationType.SYSTEM,
        title: 'Nhắc lịch phỏng vấn',
        body: `Nhắc lịch phỏng vấn ứng viên ${app.fullName} (${app.job?.name || ''}) vào lúc ${timeFormatted}.`,
        metadata: {
          type: 'RECRUITMENT_INTERVIEW_REMINDER',
          applicationId: app.id,
          applicationCode: app.applicationCode,
          interviewDate: app.interviewDate,
          targetUrl: '/recruitment',
        },
      });

      if (notifData) {
        this.notificationsService.emitCreated(notifData);
      }
    }

    return {
      success: true,
      message: `Đã gửi nhắc lịch phỏng vấn ứng viên ${app.fullName} qua Socket & Hệ thống thông báo!`,
    };
  }

  /**
   * Xuất danh sách ứng viên của tin tuyển dụng (bao gồm tất cả các trạng thái) ra file Excel chuyên nghiệp
   */
  async exportJobApplicationsToExcel(jobId?: string, statusFilter?: ApplicationStatus) {
    const job = jobId
      ? await this.prisma.jobPosting.findFirst({
          where: { OR: [{ id: jobId }, { newCode: jobId }] },
        })
      : null;

    const where: Prisma.JobApplicationWhereInput = {};
    if (job) where.jobId = job.id;
    if (statusFilter) where.status = statusFilter;

    const applications = await this.prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            name: true,
            newCode: true,
            departmentName: true,
            province: true,
            regionName: true,
            salary: true,
          },
        },
      },
    });

    const statusMapText: Record<string, string> = {
      SUBMITTED: 'Hồ sơ mới nộp',
      REVIEWING: 'Đang xem xét',
      INTERVIEW: 'Hẹn phỏng vấn',
      OFFER: 'Gửi Offer',
      HIRED: 'Trúng tuyển',
      REJECTED: 'Từ chối hồ sơ',
    };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Movie Legend HRM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh sách ứng viên', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', paperSize: 9 },
    });

    // 1. Tiêu đề chính
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÁO CÁO DANH SÁCH ỨNG VIÊN TUYỂN DỤNG';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    sheet.getRow(1).height = 42;

    // 2. Thông tin tin tuyển dụng & thời gian xuất
    sheet.getCell('A2').value = `Vị trí tuyển dụng: ${job ? job.name : 'Tất cả vị trí'}`;
    sheet.getCell('A2').font = { bold: true, size: 11 };
    sheet.getCell('E2').value = `Mã tin: ${job?.newCode || 'Tất cả'}`;
    sheet.getCell('E2').font = { bold: true, size: 11 };

    sheet.getCell('A3').value = `Phòng ban: ${job?.departmentName || 'N/A'} | Khu vực: ${job?.regionName || job?.province || 'Toàn quốc'}`;
    sheet.getCell('A3').font = { size: 10, italic: true };
    sheet.getCell('E3').value = `Mức lương: ${job?.salary || 'Thỏa thuận'}`;
    sheet.getCell('E3').font = { size: 10, italic: true };

    sheet.getCell('A4').value = `Thời gian xuất: ${formatDateTimeVn(new Date())} | Tổng cộng: ${applications.length} hồ sơ ứng viên`;
    sheet.getCell('A4').font = { size: 10, color: { argb: 'FF4B5563' } };

    // 3. Tiêu đề bảng tinh giản tối đa (8 cột cốt lõi: STT, Họ tên, Vị trí, SĐT, Email, Khu vực, Ngày nộp, File CV)
    const headers = [
      'STT',
      'Họ và tên ứng viên',
      'Vị trí ứng tuyển',
      'Số điện thoại',
      'Email',
      'Khu vực',
      'Ngày nộp hồ sơ',
      'File CV ứng tuyển',
    ];

    const headerRow = sheet.getRow(6);
    headerRow.values = headers;
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0052CC' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // 4. Các dòng dữ liệu
    applications.forEach((app, index) => {
      const rowIndex = 7 + index;
      const row = sheet.getRow(rowIndex);

      const createdText = formatDateTimeVn(new Date(app.createdAt));
      const cvUrl = app.cvFileUrl
        ? (app.cvFileUrl.startsWith('http') ? app.cvFileUrl : `http://localhost:3001${app.cvFileUrl}`)
        : '';

      row.values = [
        index + 1,
        app.fullName,
        app.job?.name || 'Vị trí Movie Legend',
        app.phone,
        app.email,
        app.city || app.job?.province || 'Toàn quốc',
        createdText,
        cvUrl ? 'Xem CV' : 'Không có CV',
      ];

      row.height = 24;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };

        // Căn giữa các cột STT, SĐT, Khu vực, Ngày nộp, File CV
        if ([1, 4, 6, 7, 8].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // Hyperlink CV ở cột 8
        if (colNumber === 8 && cvUrl) {
          cell.value = {
            text: 'Mở CV',
            hyperlink: cvUrl,
          };
          cell.font = { color: { argb: 'FF0052CC' }, underline: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // 5. Cột độ rộng (8 cột chuẩn A4)
    sheet.columns = [
      { width: 6 },  // STT
      { width: 26 }, // Họ tên ứng viên
      { width: 30 }, // Vị trí ứng tuyển
      { width: 16 }, // Số điện thoại
      { width: 28 }, // Email
      { width: 18 }, // Khu vực
      { width: 20 }, // Ngày nộp hồ sơ
      { width: 16 }, // File CV
    ];

    const rawBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(rawBuffer);

    const safeName = (job?.name || 'Tat_ca_vi_tri').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Danh_Sach_Ung_Vien_${safeName}_${dateStr}.xlsx`;

    return { buffer, filename };
  }
}


