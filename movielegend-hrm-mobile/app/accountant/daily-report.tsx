import React from 'react';
import { useAuth } from '../../src/providers/AuthProvider';
import { isAccountingLeader } from '../../src/utils/role-routing';
import { DailyReportFormScreen } from '../../src/features/daily-reports/DailyReportFormScreen';
import { LeaderDepartmentReportsScreen } from '../../src/features/daily-reports/LeaderDepartmentReportsScreen';

export default function AccountantDailyReportRoute() {
  const { user } = useAuth();
  if (isAccountingLeader(user)) {
    return <LeaderDepartmentReportsScreen />;
  }
  return <DailyReportFormScreen />;
}
