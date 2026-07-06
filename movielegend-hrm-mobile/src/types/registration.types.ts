export type FacePose = 'FRONT' | 'LEFT' | 'RIGHT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface FaceImageInput {
  pose: FacePose;
  localUri: string;
  uploadStatus: 'IDLE' | 'UPLOADING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  uploadProgress?: number | undefined;
  uploadedFileId?: string | undefined;
  imageUrl: string;
  uploadError?: string | undefined;
  previewUri?: string | undefined;
}

export interface RegistrationFormValues {
  fullName: string;
  phone: string;
  email?: string | undefined;
  password: string;
  confirmPassword: string;
  idCardNumber: string;
  dateOfBirth?: string | undefined;
  gender?: Gender | undefined;
  requestedDepartmentId: string;
  faceImages: FaceImageInput[];
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string | undefined;
  password: string;
  idCardNumber: string;
  dateOfBirth?: string | undefined;
  gender?: Gender | undefined;
  requestedDepartmentId: string;
  faceImages: Array<{ pose: FacePose; imageUrl: string; fileId?: string | undefined }>;
}

export interface RegisterResult {
  id: string;
  userCode: string;
  approvalRequestId: string;
  accountStatus: string;
  approvalStatus: string;
}
