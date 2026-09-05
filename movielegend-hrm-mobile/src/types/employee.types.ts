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

export interface TalentRetentionVault {
  id: string;
  userId: string;
  year: number;
  grantedPoints: number;
  cashValuePerPoint: number;
  status: string;
  milestones?: VestingMilestone[];
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
