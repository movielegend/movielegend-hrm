import type { AuthUser } from '../src/types/user.types';

export function makeUser(roles: string[]): AuthUser {
  return {
    id: 'user-1',
    userCode: 'USR001',
    fullName: 'MovieLegend User',
    phone: '0900000000',
    email: 'user@example.test',
    avatarUrl: null,
    roles,
    permissions: ['dashboard.own.read'],
    department: { id: 'department-1', name: 'Media' },
    position: null,
    hasFaceData: true,
  };
}

export function apiError(code: string, status = 401) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: {
        success: false,
        error: { code, message: code },
      },
    },
    message: 'Request failed',
  };
}
