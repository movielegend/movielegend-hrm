export type UserRole = 'ADMIN' | 'HR' | 'ACCOUNTANT' | 'WAREHOUSE_MANAGER' | 'LEADER' | 'EMPLOYEE' | string;

export interface DepartmentSummary {
  id: string;
  code?: string;
  name: string;
}

export interface PositionSummary {
  id: string;
  code?: string;
  name: string;
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
  department?: DepartmentSummary | null;
  position?: PositionSummary | null;
  hasFaceData: boolean;
}
