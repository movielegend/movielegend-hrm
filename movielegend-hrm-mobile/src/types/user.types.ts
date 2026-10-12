export type UserRole = 'ADMIN' | 'HR' | 'ACCOUNTANT' | 'WAREHOUSE_MANAGER' | 'LEADER' | 'EMPLOYEE' | string;

export interface BranchSummary {
  id: string;
  code?: string;
  name: string;
  address?: string | null;
}

export interface DepartmentSummary {
  id: string;
  code?: string;
  name: string;
  branchId?: string | null;
  branch?: BranchSummary | null;
}

export interface PositionSummary {
  id: string;
  code?: string;
  name: string;
}

export interface UserScope {
  role: string;
  scopeType: string;
  scopeId?: string | null;
}

export interface AuthUser {
  id: string;
  userCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  roles: UserRole[];
  permissions: string[];
  scopes?: UserScope[];
  department?: DepartmentSummary | null;
  position?: PositionSummary | null;
  hasFaceData: boolean;
  joinDate?: string | null;
  createdAt?: string | null;
  accountStatus?: string;
  isRewardVaultEnabled?: boolean;
  deletionScheduledAt?: string | null;
}
