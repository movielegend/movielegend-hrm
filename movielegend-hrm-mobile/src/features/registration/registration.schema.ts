import { z } from 'zod';

export const accountSchema = z.object({
  fullName: z.string().min(2, 'Vui long nhap ho ten'),
  phone: z.string().regex(/^[0-9+\-\s]{8,20}$/, 'So dien thoai chua hop le'),
  email: z.string().email('Email chua hop le').optional().or(z.literal('')),
  password: z.string().min(8, 'Mat khau toi thieu 8 ky tu'),
  confirmPassword: z.string().min(8, 'Vui long nhap lai mat khau'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mat khau nhap lai khong khop',
});

export const profileSchema = z.object({
  idCardNumber: z.string().min(6, 'Vui long nhap CCCD'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const departmentSchema = z.object({
  requestedDepartmentId: z.string().uuid('Vui long chon phong ban'),
});

export const faceSchema = z.object({
  faceImages: z
    .array(z.object({
      pose: z.enum(['FRONT', 'LEFT', 'RIGHT']),
      localUri: z.string().min(1),
      uploadedFileId: z.string().min(1),
      imageUrl: z.string().min(1),
      uploadStatus: z.literal('SUCCESS'),
      previewUri: z.string().optional(),
    }))
    .refine((images) => ['FRONT', 'LEFT', 'RIGHT'].every((pose) => images.some((image) => image.pose === pose && image.uploadStatus === 'SUCCESS' && image.uploadedFileId && image.imageUrl)), {
      message: 'Can du anh FRONT, LEFT, RIGHT',
    }),
});
