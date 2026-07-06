export interface WarehouseDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  address?: string | null;
  managerUserId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateWarehousePayload {
  companyId: string;
  branchId?: string;
  departmentId?: string;
  code?: string;
  name: string;
  description?: string;
  address?: string;
  managerUserId?: string;
}

export interface UpdateWarehousePayload {
  name?: string;
  description?: string;
  address?: string;
  managerUserId?: string;
  isActive?: boolean;
}
