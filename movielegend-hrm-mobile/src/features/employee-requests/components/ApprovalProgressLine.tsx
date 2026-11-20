import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmployeeRequest } from '../../../types/request.types';

interface ApprovalProgressLineProps {
  request?: EmployeeRequest | any;
  containerStyle?: ViewStyle;
}

export const ApprovalProgressLine: React.FC<ApprovalProgressLineProps> = ({
  request,
  containerStyle,
}) => {
  if (!request) return null;

  const isFinancial = ['EXPENSE', 'PURCHASE', 'ADVANCE'].includes(request.type);
  if (!isFinancial) return null;

  const meta = (request as any).metadata || {};
  const approvalSteps = Array.isArray(request.approvalSteps) ? request.approvalSteps : [];
  const stage = meta.stage || (request as any).stage || 'PENDING';

  const isPurchase = request.type === 'PURCHASE';
  const isExpense = request.type === 'EXPENSE';
  const isAdvance = request.type === 'ADVANCE';
  const isApproved = request.status === 'APPROVED';
  const isRejected = request.status === 'REJECTED';

  const leaderLog = approvalSteps.find((s: any) => 
    s.stage === 'PENDING_LEADER' || 
    (s.action === 'APPROVED' && (!s.stage || s.stage === 'PENDING_LEADER'))
  );
  const hrLog = approvalSteps.find((s: any) => 
    s.stage === 'PENDING_HR' || 
    s.action === 'HR_FIRM_APPROVED' || 
    s.action === 'PURCHASE_FULFILLED' ||
    s.stage === 'PENDING_HR_PURCHASE' ||
    (s.action === 'APPROVED' && s.stage === 'PENDING_HR')
  );
  const accountantLog = approvalSteps.find((s: any) => 
    s.stage === 'PENDING_ACCOUNTANT' || 
    s.stage === 'PENDING_DISBURSEMENT' ||
    s.action === 'DISBURSED' ||
    s.action === 'DISBURSED_TO_HR' ||
    s.action === 'FORWARD_ADMIN'
  );
  const adminLog = approvalSteps.find((s: any) => 
    s.stage === 'PENDING_ADMIN' || 
    (s.actorName && (s.actorName.includes('Ban Giám Đốc') || s.actorName.includes('Admin')))
  );

  const isLeaderDone = Boolean(leaderLog || ['PENDING_HR', 'PENDING_ACCOUNTANT', 'PENDING_ADMIN', 'PENDING_HR_PURCHASE', 'PURCHASE_FULFILLED', 'DISBURSED', 'PAID', 'COMPLETED'].includes(stage) || isApproved);
  const isLeaderCurrent = !isLeaderDone && request.status === 'PENDING' && (stage === 'PENDING_LEADER' || !stage);
  const isLeaderRejected = isRejected && (stage === 'PENDING_LEADER' || !stage);

  const isHrDone = Boolean(hrLog || ['PENDING_ACCOUNTANT', 'PENDING_ADMIN', 'PENDING_HR_PURCHASE', 'PURCHASE_FULFILLED', 'DISBURSED', 'PAID', 'COMPLETED'].includes(stage) || (isApproved && isLeaderDone));
  const isHrCurrent = !isHrDone && request.status === 'PENDING' && stage === 'PENDING_HR';
  const isHrRejected = isRejected && stage === 'PENDING_HR';

  const hasVat = Boolean(meta.hasVat || (request as any).hasVat);
  const reqAmount = Number(request.amount || 0);
  const needsAdmin = Boolean(
    adminLog || 
    stage === 'PENDING_ADMIN' || 
    (!hasVat && reqAmount > 2000000)
  );

  const isAccDone = Boolean(accountantLog || ['DISBURSED', 'PAID', 'COMPLETED', 'PENDING_HR_PURCHASE', 'PURCHASE_FULFILLED'].includes(stage) || (isApproved && isHrDone));
  const isAccCurrent = !isAccDone && request.status === 'PENDING' && ['PENDING_ACCOUNTANT', 'PENDING_DISBURSEMENT'].includes(stage);
  const isAccRejected = isRejected && ['PENDING_ACCOUNTANT', 'PENDING_DISBURSEMENT'].includes(stage);

  const isAdminDone = Boolean(adminLog || ['DISBURSED', 'PAID', 'COMPLETED', 'PENDING_HR_PURCHASE', 'PURCHASE_FULFILLED'].includes(stage) || (isApproved && isHrDone));
  const isAdminCurrent = !isAdminDone && request.status === 'PENDING' && stage === 'PENDING_ADMIN';
  const isAdminRejected = isRejected && stage === 'PENDING_ADMIN';

  let steps: Array<{
    id: string;
    stepNumber: number;
    title: string;
    isDone: boolean;
    isCurrent: boolean;
    isRejected: boolean;
  }> = [];

  if (isPurchase) {
    const isPurchaseFulfilledDone = Boolean(stage === 'PURCHASE_FULFILLED' || (isApproved && (isAdminDone || isAccDone)));
    const isPurchaseFulfilledCurrent = !isPurchaseFulfilledDone && request.status === 'PENDING' && stage === 'PENDING_HR_PURCHASE';

    steps = [
      {
        id: 'leader',
        stepNumber: 1,
        title: 'Trưởng BP',
        isDone: isLeaderDone,
        isCurrent: isLeaderCurrent,
        isRejected: isLeaderRejected,
      },
      {
        id: 'hr_quote',
        stepNumber: 2,
        title: 'HR báo giá',
        isDone: isHrDone,
        isCurrent: isHrCurrent,
        isRejected: isHrRejected || stage === 'REJECTED_TO_HR',
      },
      {
        id: 'disburse',
        stepNumber: 3,
        title: needsAdmin ? 'BGĐ duyệt' : 'Kế toán chi',
        isDone: needsAdmin ? isAdminDone : isAccDone,
        isCurrent: needsAdmin ? isAdminCurrent : isAccCurrent,
        isRejected: needsAdmin ? isAdminRejected : isAccRejected,
      },
      {
        id: 'fulfill',
        stepNumber: 4,
        title: 'Bàn giao',
        isDone: isPurchaseFulfilledDone,
        isCurrent: isPurchaseFulfilledCurrent,
        isRejected: false,
      },
    ];
  } else if (isExpense) {
    steps = [
      {
        id: 'leader',
        stepNumber: 1,
        title: 'Trưởng BP',
        isDone: isLeaderDone,
        isCurrent: isLeaderCurrent,
        isRejected: isLeaderRejected,
      },
      {
        id: 'hr_firm',
        stepNumber: 2,
        title: 'HR đối chứng',
        isDone: isHrDone,
        isCurrent: isHrCurrent,
        isRejected: isHrRejected,
      },
      {
        id: 'final_approval',
        stepNumber: 3,
        title: needsAdmin ? 'BGĐ duyệt' : 'Kế toán chi',
        isDone: needsAdmin ? isAdminDone : isAccDone,
        isCurrent: needsAdmin ? isAdminCurrent : isAccCurrent,
        isRejected: needsAdmin ? isAdminRejected : isAccRejected,
      },
    ];
  } else if (isAdvance) {
    steps = [
      {
        id: 'leader',
        stepNumber: 1,
        title: 'Trưởng BP',
        isDone: isLeaderDone,
        isCurrent: isLeaderCurrent,
        isRejected: isLeaderRejected,
      },
      {
        id: 'accountant',
        stepNumber: 2,
        title: 'Kế toán chi',
        isDone: isAccDone || isApproved,
        isCurrent: isAccCurrent,
        isRejected: isAccRejected,
      },
    ];
  }

  if (steps.length === 0) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.pipelineRow}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={step.id}>
              <View style={styles.nodeCol}>
                <View
                  style={[
                    styles.nodeCircle,
                    step.isDone && styles.nodeCircleDone,
                    step.isCurrent && styles.nodeCircleCurrent,
                    step.isRejected && styles.nodeCircleRejected,
                  ]}
                >
                  {step.isDone ? (
                    <MaterialCommunityIcons name="check" size={14} color="#16A34A" />
                  ) : step.isCurrent ? (
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#D97706" />
                  ) : step.isRejected ? (
                    <MaterialCommunityIcons name="close" size={14} color="#DC2626" />
                  ) : (
                    <Text style={styles.nodeNumberText}>{step.stepNumber}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.nodeLabel,
                    step.isDone && styles.nodeLabelDone,
                    step.isCurrent && styles.nodeLabelCurrent,
                    step.isRejected && styles.nodeLabelRejected,
                  ]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
                <Text
                  style={[
                    styles.nodeSubtext,
                    step.isDone && styles.nodeSubtextDone,
                    step.isCurrent && styles.nodeSubtextCurrent,
                    step.isRejected && styles.nodeSubtextRejected,
                  ]}
                >
                  {step.isDone ? 'Đã duyệt' : step.isCurrent ? 'Đang chờ' : step.isRejected ? 'Từ chối' : 'Chờ'}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    step.isDone && styles.connectorLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    width: '100%',
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nodeCol: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 78,
  },
  nodeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  nodeCircleDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  nodeCircleCurrent: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  nodeCircleRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  nodeNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  nodeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 2,
  },
  nodeLabelDone: {
    color: '#16A34A',
    fontWeight: '700',
  },
  nodeLabelCurrent: {
    color: '#D97706',
    fontWeight: '800',
  },
  nodeLabelRejected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  nodeSubtext: {
    fontSize: 9.5,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  nodeSubtextDone: {
    color: '#15803D',
    fontWeight: '600',
  },
  nodeSubtextCurrent: {
    color: '#B45309',
    fontWeight: '700',
  },
  nodeSubtextRejected: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 14,
    marginHorizontal: -2,
  },
  connectorLineDone: {
    backgroundColor: '#16A34A',
  },
});

export default ApprovalProgressLine;
