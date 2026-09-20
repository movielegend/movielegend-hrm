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
    maxSize: 50 * 1024 * 1024,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/m4a',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/x-7z-compressed',
      'application/octet-stream',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.m4a', '.aac', '.mp3', '.wav', '.ogg', '.pdf', '.docx', '.xlsx', '.zip', '.rar', '.7z', '.tar', '.gz'],
  },
  EMPLOYEE_DOCUMENT: {
    purpose: UploadPurpose.EMPLOYEE_DOCUMENT,
    maxSize: 25 * 1024 * 1024,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'text/csv',
    ],
    extensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.pdf',
      '.docx',
      '.xlsx',
      '.pptx',
      '.doc',
      '.xls',
      '.ppt',
      '.txt',
      '.csv',
    ],
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
    maxSize: 50 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.mov'],
  },
};

export const maxUploadSize = Math.max(...Object.values(uploadPolicies).map((policy) => policy.maxSize));
