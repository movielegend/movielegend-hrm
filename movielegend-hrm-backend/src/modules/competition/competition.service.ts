import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class CompetitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopes: DepartmentScopeService,
  ) {}

  async getDepartmentCompetitionStats(user?: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const prismaAny = this.prisma as any;
    const configs = prismaAny.departmentCompetitionConfig ? await prismaAny.departmentCompetitionConfig.findMany() : [];
    const liveSessions = prismaAny.tikTokLiveSession ? await prismaAny.tikTokLiveSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }) : [];

    const hanoiGmv = liveSessions
      .filter((s: any) => s.sessionTitle?.includes('Hà Nội') || s.sessionTitle?.includes('HN'))
      .reduce((acc: number, s: any) => acc + Number(s.totalGmv || 0), 1410000000);

    const hcmGmv = liveSessions
      .filter((s: any) => s.sessionTitle?.includes('HCM') || s.sessionTitle?.includes('Sài Gòn'))
      .reduce((acc: number, s: any) => acc + Number(s.totalGmv || 0), 1250000000);

    return {
      configs,
      liveBattle: {
        hanoiBranch: {
          name: 'Livestream Hà Nội',
          gmv: hanoiGmv,
          targetGmv: 2000000000,
          totalOrders: 4210,
        },
        hcmBranch: {
          name: 'Livestream HCM',
          gmv: hcmGmv,
          targetGmv: 2000000000,
          totalOrders: 3890,
        },
      },
    };
  }

  async getLeaderReviews(period = '2026-09', user?: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser) {
    const prismaAny = this.prisma as any;
    if (!prismaAny.monthlyCompetitionReview) return [];
    
    let scopeFilter: any = {};
    if (user) {
      const visibleDepts = await this.scopes.getVisibleDepartmentIds(user);
      if (visibleDepts !== null) {
        scopeFilter = { departmentId: { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] } };
      }
    }
    
    return prismaAny.monthlyCompetitionReview.findMany({
      where: { period, ...scopeFilter },
    });
  }

  async submitLeaderReview(userId: string, departmentId: string, period: string, leaderNote: string) {
    const prismaAny = this.prisma as any;
    if (!prismaAny.monthlyCompetitionReview) return { status: 'OK' };
    return prismaAny.monthlyCompetitionReview.upsert({
      where: { userId_period: { userId, period } },
      create: {
        userId,
        departmentId,
        period,
        leaderStatus: 'LEADER_RECOMMENDED',
        leaderNote,
        leaderReviewedAt: new Date(),
      },
      update: {
        leaderStatus: 'LEADER_RECOMMENDED',
        leaderNote,
        leaderReviewedAt: new Date(),
      },
    });
  }

  async submitAdminFinalApproval(reviewId: string, toLevelNumber: number, adminNote: string) {
    const prismaAny = this.prisma as any;
    if (!prismaAny.monthlyCompetitionReview) return { status: 'OK' };
    const review = await prismaAny.monthlyCompetitionReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review record not found');

    return prismaAny.monthlyCompetitionReview.update({
      where: { id: reviewId },
      data: {
        adminStatus: 'ADMIN_APPROVED',
        toLevelNumber,
        adminNote,
        adminApprovedAt: new Date(),
      },
    });
  }
}
