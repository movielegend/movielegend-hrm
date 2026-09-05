import type { Department } from './department.types';
import type { Position } from './position.types';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserRoleLink {
  id: string;
  scopeType?: string;
  scopeId?: string | null;
  role: {
    id: string;
    code: string;
    name: string;
  };
}

export interface DepartmentMemberLink {
  id?: string;
  departmentId: string;
  positionId?: string | null;
  isPrimary?: boolean;
  department?: Department;
  position?: Position | null;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  fullName: string;
  idCardNumber?: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  joinDate?: string | null;
  employmentStatus?: string;
  position?: Position | null;
}

export interface FaceRegistrationImage {
  id: string;
  pose: string;
  imageUrl: string;
}

export interface FaceProfile {
  id: string;
  status: string;
  images: FaceRegistrationImage[];
}

export type VaultTransactionType =
  | 'GRANT_ANNUAL'
  | 'GRANT_PROJECT_INSTANT'
  | 'GRANT_PROJECT_VESTING'
  | 'WITHDRAW_REGULAR'
  | 'WITHDRAW_ADVANCE'
  | 'REFUND_WITHDRAWAL';

export type GrantVaultType = 'ANNUAL' | 'PROJECT_INSTANT' | 'PROJECT_VESTING';

export interface VaultTransaction {
  id: string;
  vaultId: string;
  userId: string;
  type: VaultTransactionType;
  points: number;
  cashAmount: number;
  quarterTarget?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface VestingMilestone {
  id: string;
  vaultId: string;
  quarter: number;
  unlockDate: string;
  pointsToUnlock: number;
  cashAmount: number;
  isUnlocked: boolean;
  isWithdrawn: boolean;
  withdrawnAt?: string | null;
}

export interface GrantMilestone {
  id: string;
  packageId: string;
  milestoneIndex: number;
  title: string;
  unlockDate: string;
  pointsToUnlock: number;
  cashAmount: number;
  withdrawnPoints: number;
  isUnlocked: boolean;
  isWithdrawn: boolean;
  withdrawnAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGrantPackage {
  id: string;
  vaultId: string;
  userId: string;
  title: string;
  totalPoints: number;
  cashValuePerPoint: number;
  startDate: string;
  durationMonths: number;
  intervalMonths: number;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  milestones?: GrantMilestone[];
}

export interface TalentRetentionVault {
  id: string;
  userId: string;
  year: number;
  grantedPoints: number;
  instantBonusPoints?: number;
  cashValuePerPoint: number;
  status: string;
  milestones?: VestingMilestone[];
  packages?: ProjectGrantPackage[];
  transactions?: VaultTransaction[];
}

export interface GrantProjectPackagePayload {
  userId: string;
  title: string;
  points: number;
  year?: number;
  cashValuePerPoint?: number;
  startDate?: string;
  durationMonths?: number;
  intervalMonths?: number;
  note?: string;
}

export interface BulkGrantProjectPackagePayload {
  departmentId?: string;
  userIds?: string[];
  title: string;
  points: number;
  year?: number;
  cashValuePerPoint?: number;
  startDate?: string;
  durationMonths?: number;
  intervalMonths?: number;
  note?: string;
}

export interface MyVaultStats {
  totalGrantedPoints: number;
  instantBonusPoints: number;
  unlockedQuarterPoints: number;
  lockedQuarterPoints: number;
  unlockedPoints: number;
  maxWithdrawable: number;
  cashValuePerPoint: number;
}

export type WithdrawalRequestStatus = 'PENDING_ADMIN' | 'PENDING_ACCOUNTANT' | 'PAID' | 'REJECTED';

export interface RewardWithdrawalRequest {
  id: string;
  userId: string;
  pointsWithdrawn: number;
  cashAmount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  note?: string | null;
  status: WithdrawalRequestStatus;
  adminApprovedBy?: string | null;
  adminApprovedAt?: string | null;
  adminNote?: string | null;
  accountantConfirmedBy?: string | null;
  accountantConfirmedAt?: string | null;
  accountantNote?: string | null;
  transactionReference?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    userCode: string;
    email?: string;
    phone?: string;
    profile?: {
      fullName: string;
      avatarUrl?: string;
      position?: string;
    };
    departmentLinks?: Array<{
      department?: { name: string };
      position?: { name: string };
    }>;
  };
}

export interface WithdrawalRequestsResponse {
  items: RewardWithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    PENDING_ADMIN: number;
    PENDING_ACCOUNTANT: number;
    PAID: number;
    REJECTED: number;
    TOTAL: number;
  };
}

export interface MyVaultResponse {
  isVaultEnabled: boolean;
  vault: TalentRetentionVault | null;
  withdrawalRequests?: RewardWithdrawalRequest[];
  stats: MyVaultStats;
}

export interface EmployeeUser {
  id: string;
  userCode: string;
  phone: string;
  email?: string | null;
  accountStatus: AccountStatus;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  isRewardVaultEnabled?: boolean;
  retentionVaults?: TalentRetentionVault[];
  createdAt?: string;
  updatedAt?: string;
  profile?: EmployeeProfile | null;
  roles?: UserRoleLink[];
  departmentLinks?: DepartmentMemberLink[];
  faceProfile?: FaceProfile | null;
}

export interface EmployeeListFilters {
  search?: string;
  departmentId?: string;
  role?: string;
  accountStatus?: AccountStatus;
  approvalStatus?: ApprovalStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ScopedEmployee {
  id: string;
  userCode: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  position?: {
    id: string;
    name: string;
  } | null;
  employmentStatus?: string | null;
  accountStatus?: AccountStatus;
  isActive: boolean;
  isRewardVaultEnabled?: boolean;
}

export interface ScopedEmployeeFilters {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  positionId?: string;
  accountStatus?: AccountStatus;
  isActive?: boolean;
  isRewardVaultEnabled?: boolean;
}
