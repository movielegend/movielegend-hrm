import { apiClient, unwrapData } from './client';
import type { ApiResponse } from '../types/api.types';
import type { RegisterPayload, RegisterResult } from '../types/registration.types';

export async function registerEmployee(payload: RegisterPayload): Promise<RegisterResult> {
  const response = await apiClient.post<ApiResponse<RegisterResult>>('/auth/register', payload);
  return unwrapData(response);
}

export interface CheckAvailabilityResult {
  isAvailable: boolean;
  phoneDuplicate?: boolean;
  emailDuplicate?: boolean;
  idCardDuplicate?: boolean;
  message?: string;
}

export async function checkAccountAvailability(params: {
  phone?: string;
  email?: string;
  idCardNumber?: string;
}): Promise<CheckAvailabilityResult> {
  // 1. Try dedicated endpoint first if available
  try {
    const res = await apiClient.post<ApiResponse<CheckAvailabilityResult>>('/auth/check-availability', params);
    if (res.data && res.data.success && res.data.data) {
      return res.data.data;
    }
  } catch (err: any) {
    // If endpoint doesn't exist or returns 404, fallback to probe validation
  }

  // 2. Fallback probe validation
  const result: CheckAvailabilityResult = {
    isAvailable: true,
  };

  const tasks: Promise<unknown>[] = [];

  // Check phone
  if (params.phone) {
    tasks.push(
      apiClient
        .post('/auth/register', {
          phone: params.phone,
          password: 'DummyPassword123!',
          fullName: 'Check Probe',
          idCardNumber: '000000000000',
          requestedDepartmentId: '00000000-0000-0000-0000-000000000000',
        })
        .catch((err) => {
          const code = err?.response?.data?.error?.code;
          if (code === 'DUPLICATE_PHONE') {
            result.isAvailable = false;
            result.phoneDuplicate = true;
            result.message = 'Số điện thoại này đã được đăng ký trên hệ thống. Vui lòng nhập số khác.';
          }
        })
    );
  }

  // Check email
  if (params.email) {
    tasks.push(
      apiClient
        .post('/auth/register', {
          phone: '0999999999',
          email: params.email,
          password: 'DummyPassword123!',
          fullName: 'Check Probe',
          idCardNumber: '000000000000',
          requestedDepartmentId: '00000000-0000-0000-0000-000000000000',
        })
        .catch((err) => {
          const code = err?.response?.data?.error?.code;
          if (code === 'DUPLICATE_EMAIL') {
            result.isAvailable = false;
            result.emailDuplicate = true;
            if (!result.message) {
              result.message = 'Email này đã được đăng ký trên hệ thống. Vui lòng nhập email khác.';
            }
          }
        })
    );
  }

  // Check CCCD
  if (params.idCardNumber) {
    tasks.push(
      apiClient
        .post('/auth/register', {
          phone: '0999999999',
          password: 'DummyPassword123!',
          fullName: 'Check Probe',
          idCardNumber: params.idCardNumber,
          requestedDepartmentId: '00000000-0000-0000-0000-000000000000',
        })
        .catch((err) => {
          const code = err?.response?.data?.error?.code;
          if (code === 'DUPLICATE_ID_CARD') {
            result.isAvailable = false;
            result.idCardDuplicate = true;
            result.message = 'Số CCCD/CMND này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.';
          }
        })
    );
  }

  await Promise.all(tasks);

  if (result.phoneDuplicate && result.emailDuplicate) {
    result.message = 'Số điện thoại và Email đều đã được đăng ký. Vui lòng nhập thông tin khác.';
  }

  return result;
}

