export interface Position {
  id: string;
  departmentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}
