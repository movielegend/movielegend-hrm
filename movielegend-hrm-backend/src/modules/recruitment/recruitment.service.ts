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
   * Lấy danh sách các phòng ban đang mở tuyển dụng (kèm số lượng tin)
   */
  async getDepartments() {
    const groups = await this.prisma.jobPosting.groupBy({
      by: ['departmentName'],
      where: {
        status: JobStatus.PUBLISHED,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    return groups.map((g, index) => ({
      id: index + 1,
      code: g.departmentName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: g.departmentName,
      total: g._count.id,
      iconUrl: `/assets/images/${index % 2 === 0 ? 'cong-nghe' : 'kinh-doanh'}.png`,
    }));
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
      title: '📄 Ứng viên mới nộp hồ sơ',
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
      title: '📅 Đã lên lịch phỏng vấn',
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
          title: '⏰ Nhắc lịch phỏng vấn sắp diễn ra',
          message: `Sắp đến giờ phỏng vấn ứng viên ${app.fullName} cho vị trí "${app.job?.name || ''}" lúc ${timeFormatted}.`,
        };

        this.logger.log(`[Socket] Gửi nhắc lịch phỏng vấn ứng viên ${app.fullName} lúc ${timeFormatted}`);

        this.realtime.emitToRoom('company', 'recruitment:interview_reminder', eventPayload);
        this.realtime.emitToRoom('recruitment', 'recruitment:interview_reminder', eventPayload);

        if (hrUserIds.length > 0) {
          const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
            type: NotificationType.SYSTEM,
            title: '⏰ Nhắc lịch phỏng vấn',
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
      title: '⏰ Nhắc lịch phỏng vấn',
      message: `Nhắc lịch phỏng vấn ứng viên ${app.fullName} (${app.job?.name || ''}) vào lúc ${timeFormatted}.`,
    };

    this.realtime.emitToRoom('company', 'recruitment:interview_reminder', eventPayload);
    this.realtime.emitToRoom('recruitment', 'recruitment:interview_reminder', eventPayload);

    const hrUserIds = await this.getHrAndAdminUserIds();
    if (hrUserIds.length > 0) {
      const notifData = await this.notificationsService.createForUsers(this.prisma, hrUserIds, {
        type: NotificationType.SYSTEM,
        title: '⏰ Nhắc lịch phỏng vấn',
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
    sheet.mergeCells('A1:R1');
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
    sheet.getCell('G2').value = `Mã tin: ${job?.newCode || 'Tất cả'}`;
    sheet.getCell('G2').font = { bold: true, size: 11 };

    sheet.getCell('A3').value = `Phòng ban: ${job?.departmentName || 'N/A'} | Khu vực: ${job?.regionName || job?.province || 'Toàn quốc'}`;
    sheet.getCell('A3').font = { size: 10, italic: true };
    sheet.getCell('G3').value = `Mức lương: ${job?.salary || 'Thỏa thuận'}`;
    sheet.getCell('G3').font = { size: 10, italic: true };

    sheet.getCell('A4').value = `Thời gian xuất: ${formatDateTimeVn(new Date())} | Tổng cộng: ${applications.length} hồ sơ ứng viên`;
    sheet.getCell('A4').font = { size: 10, color: { argb: 'FF4B5563' } };

    // 3. Tiêu đề bảng
    const headers = [
      'STT',
      'Mã hồ sơ',
      'Họ và tên ứng viên',
      'Trạng thái hồ sơ',
      'Số điện thoại',
      'Email',
      'Khu vực',
      'Trình độ học vấn',
      'Trường đào tạo',
      'Chuyên ngành',
      'Kinh nghiệm',
      'Công ty gần nhất',
      'Kỹ năng nổi bật',
      'Lịch hẹn phỏng vấn',
      'Đánh giá của HR',
      'Lý do từ chối',
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

      const statusText = statusMapText[app.status] || app.status;
      const interviewText = app.interviewDate ? formatDateTimeVn(new Date(app.interviewDate)) : 'Chưa có lịch';
      const createdText = formatDateTimeVn(new Date(app.createdAt));
      const cvUrl = app.cvFileUrl
        ? (app.cvFileUrl.startsWith('http') ? app.cvFileUrl : `http://localhost:3001${app.cvFileUrl}`)
        : '';

      row.values = [
        index + 1,
        app.applicationCode || app.id.slice(0, 8),
        app.fullName,
        statusText,
        app.phone,
        app.email,
        app.city || 'N/A',
        app.educationLevel || 'N/A',
        app.university || 'N/A',
        app.major || 'N/A',
        app.experienceYears || 'N/A',
        app.currentCompany || 'N/A',
        app.skills || 'N/A',
        interviewText,
        app.hrNotes || '',
        app.rejectionReason || '',
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

        if ([1, 2, 4, 5, 7, 14, 17].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // Highlight màu theo trạng thái
        if (colNumber === 4) {
          if (app.status === 'HIRED') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
          } else if (app.status === 'INTERVIEW') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF5B21B6' } };
          } else if (app.status === 'OFFER') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
          } else if (app.status === 'REJECTED') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
          } else if (app.status === 'REVIEWING') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' } };
          }
        }

        // Hyperlink CV
        if (colNumber === 18 && cvUrl) {
          cell.value = {
            text: 'Mở CV',
            hyperlink: cvUrl,
          };
          cell.font = { color: { argb: 'FF0052CC' }, underline: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // 5. Cột độ rộng
    sheet.columns = [
      { width: 6 },
      { width: 16 },
      { width: 25 },
      { width: 24 },
      { width: 15 },
      { width: 26 },
      { width: 14 },
      { width: 15 },
      { width: 25 },
      { width: 22 },
      { width: 15 },
      { width: 25 },
      { width: 30 },
      { width: 24 },
      { width: 30 },
      { width: 24 },
      { width: 24 },
      { width: 15 },
    ];

    const rawBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(rawBuffer);

    const safeName = (job?.name || 'Tat_ca_vi_tri').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Danh_Sach_Ung_Vien_${safeName}_${dateStr}.xlsx`;

    return { buffer, filename };
  }
}


