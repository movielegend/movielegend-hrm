/** Prisma Decimal fields serialize as strings in JSON. */
export type DecimalString = string | number;

export interface MaterialCategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDto {
  id: string;
  categoryId: string;
  materialCode: string;
  name: string;
  description?: string | null;
  unit: string;
  minimumStock: DecimalString;
  maximumStock?: DecimalString | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MaterialCategoryDto;
}

export interface CreateMaterialCategoryPayload {
  code: string;
  name: string;
  description?: string;
}

export interface CreateMaterialPayload {
  categoryId: string;
  materialCode?: string;
  name: string;
  description?: string;
  unit: string;
  minimumStock?: number;
  maximumStock?: number;
}

export interface UpdateMaterialPayload {
  name?: string;
  description?: string;
  unit?: string;
  minimumStock?: number;
  maximumStock?: number;
}
