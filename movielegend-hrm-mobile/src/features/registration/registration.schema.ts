import { z } from 'zod';

export const accountSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ tên'),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0)'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string().min(8, 'Vui lòng nhập lại mật khẩu'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu nhập lại không khớp',
});

export const profileSchema = z.object({
  idCardNumber: z.string().regex(/^[0-9]{12}$/, 'Số CCCD phải bao gồm đúng 12 chữ số'),
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
