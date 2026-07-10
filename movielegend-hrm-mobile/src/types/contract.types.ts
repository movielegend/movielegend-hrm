export type ContractType =
  | 'PROBATION'
  | 'FIXED_TERM'
  | 'INDEFINITE_TERM'
  | 'SERVICE'
  | 'CONFIDENTIALITY'
  | 'COMMITMENT'
  | 'OTHER';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_INTERNAL_APPROVAL'
  | 'APPROVED'
  | 'WAITING_EMPLOYEE_SIGNATURE'
  | 'EMPLOYEE_SIGNED'
  | 'WAITING_COMPANY_SIGNATURE'
  | 'COMPLETED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED';

export type ContractSignerRole = 'EMPLOYEE' | 'COMPANY';

export type SignatureType = 'DRAWN' | 'UPLOADED' | 'OTP_CONFIRMED' | 'EXTERNAL_PROVIDER';

export type AcknowledgementStatus = 'PENDING' | 'AGREED' | 'DISAGREED';

export interface ContractTemplateDto {
  id: string;
  companyId: string;
  code: string;
  name: string;
  contractType: ContractType;
  description: string | null;
  templateFileUrl: string;
  storageKey: string | null;
  version: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; userCode: string; profile?: { fullName: string } | null };
}

export interface EmployeeContractDto {
  id: string;
  contractCode: string;
  userId: string;
  contractTemplateId: string;
  contractTemplateVersionId: string;
  contractType: ContractType;
  title: string;
  startDate: string;
  endDate: string | null;
  status: ContractStatus;
  baseSalarySnapshot: unknown;
  positionSnapshot: unknown;
  departmentSnapshot: unknown;
  draftFileUrl: string | null;
  signedFileUrl: string | null;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  employeeSignedAt: string | null;
  companySignedAt: string | null;
  effectiveAt: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
  employeeAcknowledgementStatus: AcknowledgementStatus;
  employeeAcknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    userCode: string;
    profile?: { fullName: string } | null;
  };
  contractTemplate?: ContractTemplateDto;
  createdBy?: { id: string; userCode: string; profile?: { fullName: string } | null };
  approvedBy?: { id: string; userCode: string; profile?: { fullName: string } | null } | null;
  signatures?: ContractSignatureDto[];
}

export interface ContractSignatureDto {
  id: string;
  contractId: string;
  signerUserId: string;
  signerRole: ContractSignerRole;
  signatureType: SignatureType;
  signatureImageUrl: string | null;
  signedAt: string;
  signer?: { id: string; userCode: string; profile?: { fullName: string } | null };
}

export interface CreateContractTemplatePayload {
  code: string;
  name: string;
  contractType: ContractType;
  description?: string;
  templateFileUrl: string;
}

export interface UpdateContractTemplatePayload {
  name?: string;
  description?: string;
  templateFileUrl?: string;
  isActive?: boolean;
}

export interface CreateEmployeeContractPayload {
  userId: string;
  contractTemplateId: string;
  contractType: ContractType;
  title: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateEmployeeContractPayload {
  title?: string;
  startDate?: string;
  endDate?: string;
}

export interface RejectContractPayload {
  reason: string;
}

export interface SignContractPayload {
  signatureType: SignatureType;
  signatureImageUrl?: string;
}

export interface TerminateContractPayload {
  reason: string;
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  PROBATION: 'Thử việc',
  FIXED_TERM: 'Có thời hạn',
  INDEFINITE_TERM: 'Không thời hạn',
  SERVICE: 'Dịch vụ',
  CONFIDENTIALITY: 'Bảo mật',
  COMMITMENT: 'Cam kết',
  OTHER: 'Khác',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_INTERNAL_APPROVAL: 'Chờ duyệt nội bộ',
  APPROVED: 'Đã duyệt',
  WAITING_EMPLOYEE_SIGNATURE: 'Chờ NV ký',
  EMPLOYEE_SIGNED: 'NV đã ký',
  WAITING_COMPANY_SIGNATURE: 'Chờ công ty ký',
  COMPLETED: 'Hoàn tất',
  ACTIVE: 'Có hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Đã chấm dứt',
  CANCELLED: 'Đã hủy',
};
