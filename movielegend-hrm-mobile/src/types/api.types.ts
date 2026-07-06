export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export interface NormalizedApiError {
  code: string;
  message: string;
  status?: number;
  category:
    | 'business'
    | 'unauthorized'
    | 'forbidden'
    | 'validation'
    | 'rate_limited'
    | 'server'
    | 'timeout'
    | 'offline'
    | 'network'
    | 'unknown';
}
