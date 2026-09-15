import type { MyVaultResponse, ProjectGrantPackage, VestingMilestone } from '../../types/employee.types';

export interface NextVaultMilestoneInfo {
  isAllUnlocked: boolean;
  hasMilestones: boolean;
  packageTitle?: string;
  title: string;
  points: number;
  cashAmount: number;
  unlockDate: Date;
  cycleStartDate: Date;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progressPercent: number;
  startDateFormatted: string;
  unlockDateFormatted: string;
}

export function getNextVaultMilestone(
  myVault?: MyVaultResponse | null,
  currentTime: Date = new Date()
): NextVaultMilestoneInfo | null {
  if (!myVault || !myVault.vault) {
    return null;
  }

  const vault = myVault.vault;
  const stats = myVault.stats || {
    totalGrantedPoints: 0,
    unlockedPoints: 0,
    cashValuePerPoint: 1000,
  };
  const cashValuePerPoint = stats.cashValuePerPoint || 1000;
  const packages: ProjectGrantPackage[] = vault.packages || [];
  const legacyMilestones: VestingMilestone[] = vault.milestones || [];
  const currentYear = currentTime.getFullYear();

  interface UpcomingItem {
    packageTitle?: string;
    title: string;
    points: number;
    cashAmount: number;
    unlockDate: Date;
    cycleStartDate: Date;
  }

  const upcomingList: UpcomingItem[] = [];
  let totalMilestonesCount = 0;

  if (packages.length > 0) {
    packages.forEach((pkg) => {
      const milestones = pkg.milestones || [];
      totalMilestonesCount += milestones.length;
      milestones.forEach((m, mIdx) => {
        const unlockDate = new Date(m.unlockDate);
        const remaining = Math.max(0, m.pointsToUnlock - (m.withdrawnPoints || 0));
        if (unlockDate > currentTime && remaining > 0) {
          let cycleStartDate: Date;
          const prevMilestone = mIdx > 0 ? milestones[mIdx - 1] : undefined;
          if (prevMilestone) {
            cycleStartDate = new Date(prevMilestone.unlockDate);
          } else if (pkg.startDate) {
            cycleStartDate = new Date(pkg.startDate);
          } else {
            cycleStartDate = new Date(unlockDate.getTime() - (pkg.intervalMonths || 3) * 30 * 24 * 3600 * 1000);
          }

          upcomingList.push({
            packageTitle: pkg.title,
            title: m.title || `Đợt ${mIdx + 1}`,
            points: remaining,
            cashAmount: remaining * cashValuePerPoint,
            unlockDate,
            cycleStartDate,
          });
        }
      });
    });
  } else if (legacyMilestones.length > 0 || (stats.totalGrantedPoints && stats.totalGrantedPoints > 0)) {
    const qMeta = [
      { q: 1, label: 'Quý 1', dateLabel: '31/03', unlockDate: new Date(currentYear, 2, 31) },
      { q: 2, label: 'Quý 2', dateLabel: '30/06', unlockDate: new Date(currentYear, 5, 30) },
      { q: 3, label: 'Quý 3', dateLabel: '30/09', unlockDate: new Date(currentYear, 8, 30) },
      { q: 4, label: 'Quý 4 (Tết)', dateLabel: '31/12', unlockDate: new Date(currentYear, 11, 31) },
    ];
    totalMilestonesCount += qMeta.length;

    qMeta.forEach((qm) => {
      const found = legacyMilestones.find((m) => m.quarter === qm.q);
      const unlockDate = found ? new Date(found.unlockDate) : qm.unlockDate;
      const points = found ? found.pointsToUnlock : Math.floor(stats.totalGrantedPoints / 4);
      const cash = Number(found?.cashAmount || points * cashValuePerPoint);
      const isWithdrawn = found ? Boolean(found.isWithdrawn) : false;

      if (unlockDate > currentTime && !isWithdrawn && points > 0) {
        const qStartMonth = (qm.q - 1) * 3;
        const cycleStartDate = new Date(currentYear, qStartMonth, 1);
        upcomingList.push({
          packageTitle: `Quỹ Năm ${currentYear}`,
          title: qm.label,
          points,
          cashAmount: cash,
          unlockDate,
          cycleStartDate,
        });
      }
    });
  }

  if (upcomingList.length === 0) {
    if (totalMilestonesCount > 0 || (stats.totalGrantedPoints && stats.totalGrantedPoints > 0)) {
      return {
        isAllUnlocked: true,
        hasMilestones: true,
        title: 'Tất cả các đợt đã mở',
        points: 0,
        cashAmount: 0,
        unlockDate: currentTime,
        cycleStartDate: currentTime,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progressPercent: 100,
        startDateFormatted: '',
        unlockDateFormatted: '',
      };
    }
    return null;
  }

  upcomingList.sort((a, b) => a.unlockDate.getTime() - b.unlockDate.getTime());
  const nearest = upcomingList[0];
  if (!nearest) return null;

  const diffMs = Math.max(0, nearest.unlockDate.getTime() - currentTime.getTime());
  const totalDurationMs = Math.max(1000, nearest.unlockDate.getTime() - nearest.cycleStartDate.getTime());
  const elapsedMs = Math.max(0, currentTime.getTime() - nearest.cycleStartDate.getTime());
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startD = nearest.cycleStartDate;
  const endD = nearest.unlockDate;

  return {
    isAllUnlocked: false,
    hasMilestones: true,
    packageTitle: nearest.packageTitle,
    title: nearest.title,
    points: nearest.points,
    cashAmount: nearest.cashAmount,
    unlockDate: nearest.unlockDate,
    cycleStartDate: nearest.cycleStartDate,
    days,
    hours,
    minutes,
    seconds,
    progressPercent,
    startDateFormatted: `${pad(startD.getDate())}/${pad(startD.getMonth() + 1)}/${startD.getFullYear()}`,
    unlockDateFormatted: `${pad(endD.getDate())}/${pad(endD.getMonth() + 1)}/${endD.getFullYear()}`,
  };
}
