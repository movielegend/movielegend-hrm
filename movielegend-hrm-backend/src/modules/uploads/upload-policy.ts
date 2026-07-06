import { UploadPurpose } from '@prisma/client';

export interface UploadPolicy {
  purpose: UploadPurpose;
  maxSize: number;
  mimeTypes: string[];
  extensions: string[];
}

export const uploadPolicies: Record<UploadPurpose, UploadPolicy> = {
  FACE_REGISTRATION: {
    purpose: UploadPurpose.FACE_REGISTRATION,
    maxSize: 3 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  ATTENDANCE: {
    purpose: UploadPurpose.ATTENDANCE,
    maxSize: 3 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  TASK_ATTACHMENT: {
    purpose: UploadPurpose.TASK_ATTACHMENT,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx'],
  },
  EMPLOYEE_DOCUMENT: {
    purpose: UploadPurpose.EMPLOYEE_DOCUMENT,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  },
  CONTRACT_TEMPLATE: {
    purpose: UploadPurpose.CONTRACT_TEMPLATE,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.docx'],
  },
  SIGNATURE: {
    purpose: UploadPurpose.SIGNATURE,
    maxSize: 1 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  KPI_EVIDENCE: {
    purpose: UploadPurpose.KPI_EVIDENCE,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  },
  ASSET_INCIDENT: {
    purpose: UploadPurpose.ASSET_INCIDENT,
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  },
};

export const maxUploadSize = Math.max(...Object.values(uploadPolicies).map((policy) => policy.maxSize));
