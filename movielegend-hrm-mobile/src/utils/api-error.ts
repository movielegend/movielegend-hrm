import axios, { AxiosError } from 'axios';
import type { ApiErrorBody, NormalizedApiError } from '../types/api.types';

const loginErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Sai số điện thoại hoặc mật khẩu',
  ACCOUNT_PENDING_APPROVAL: 'Tài khoản đang chờ phê duyệt',
  ACCOUNT_REJECTED: 'Tài khoản đã bị từ chối',
  ACCOUNT_SUSPENDED: 'Tài khoản đang bị khóa',
  ACCOUNT_INACTIVE: 'Tài khoản chưa hoạt động',
};

export function mapLoginError(error: unknown): string {
  const normalized = normalizeApiError(error);
  return loginErrorMessages[normalized.code] ?? normalized.message;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) return fromAxiosError(error);
  if (error instanceof Error) {
    return { code: 'UNKNOWN_ERROR', message: error.message, category: 'unknown' };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Có lỗi xảy ra', category: 'unknown' };
}

function fromAxiosError(error: AxiosError<ApiErrorBody>): NormalizedApiError {
  if (error.code === 'ECONNABORTED') {
    return withOptionalStatus({ code: 'TIMEOUT', message: 'Kết nối quá hạn', category: 'timeout' }, error.response?.status);
  }
  if (!error.response) {
    const message = error.message === 'Network Error' ? 'Không thể kết nối máy chủ' : error.message;
    return { code: 'NETWORK_ERROR', message, category: error.message === 'Network Error' ? 'offline' : 'network' };
  }
  const code = error.response.data?.error?.code ?? codeFromStatus(error.response.status);
  const message = error.response.data?.error?.message ?? messageFromStatus(error.response.status);
  return withOptionalStatus({
    code,
    message,
    category: categoryFromStatus(error.response.status),
  }, error.response.status);
}

function withOptionalStatus(
  error: Omit<NormalizedApiError, 'status'>,
  status: number | undefined,
): NormalizedApiError {
  return typeof status === 'number' ? { ...error, status } : error;
}

function codeFromStatus(status: number): string {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'BUSINESS_ERROR';
}

function messageFromStatus(status: number): string {
  if (status === 401) return 'Phiên đăng nhập không hợp lệ';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này';
  if (status === 429) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau';
  if (status >= 500) return 'Máy chủ đang gặp sự cố';
  return 'Yêu cầu không hợp lệ';
}

function categoryFromStatus(status: number): NormalizedApiError['category'] {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'business';
}
