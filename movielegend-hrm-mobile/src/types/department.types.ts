export interface Department {
  id: string;
  companyId: string;
  branchId?: string | null;
  parentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  leaderUserId?: string | null;
  leader?: {
    id?: string;
    userCode?: string;
    profile?: { fullName: string; avatarUrl?: string | null } | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    region?: { id: string; name: string } | null;
  } | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentPayload {
  companyId?: string;
  branchId?: string;
  parentId?: string;
  code: string;
  name: string;
  description?: string;
}

export interface UpdateDepartmentPayload extends Partial<CreateDepartmentPayload> {
  isActive?: boolean;
}
