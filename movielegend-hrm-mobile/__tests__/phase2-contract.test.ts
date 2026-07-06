import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { approveAccount, getApprovals, rejectAccount } from '../src/api/approvals.api';
import { apiClient } from '../src/api/client';
import { createDepartment, getDepartment, getDepartments, updateDepartment } from '../src/api/departments.api';
import { getAdminUser, getEmployeeReport, getEmployees, updateEmployee } from '../src/api/employees.api';
import { assignLeader } from '../src/api/leader-assignments.api';
import { getPositions } from '../src/api/positions.api';
import { uploadFile } from '../src/api/uploads.api';
import { accountSchema, departmentSchema, faceSchema, profileSchema } from '../src/features/registration/registration.schema';
import { makeUser } from '../test/test-utils';
import { hasAnyPermission, hasPermission } from '../src/utils/permissions';
import { maskIdCard, maskPhone } from '../src/utils/privacy';

describe('phase 2 registration validation', () => {
  it('accepts a valid account step', () => {
    expect(accountSchema.safeParse({
      fullName: 'MovieLegend Employee',
      phone: '0900000000',
      email: 'employee@example.test',
      password: 'password123',
      confirmPassword: 'password123',
    }).success).toBe(true);
  });

  it('rejects mismatched password confirmation', () => {
    expect(accountSchema.safeParse({
      fullName: 'MovieLegend Employee',
      phone: '0900000000',
      password: 'password123',
      confirmPassword: 'password456',
    }).success).toBe(false);
  });

  it('requires a selected backend department id', () => {
    expect(departmentSchema.safeParse({ requestedDepartmentId: 'not-a-uuid' }).success).toBe(false);
  });

  it('accepts supported profile gender values only', () => {
    expect(profileSchema.safeParse({ idCardNumber: '123456789012', gender: 'MALE' }).success).toBe(true);
    expect(profileSchema.safeParse({ idCardNumber: '123456789012', gender: 'UNKNOWN' }).success).toBe(false);
  });

  it('requires FRONT, LEFT and RIGHT face images', () => {
    expect(faceSchema.safeParse({
      faceImages: [
        { pose: 'FRONT', localUri: 'file://front.jpg', uploadedFileId: 'file-front', imageUrl: '/uploads/front.jpg', uploadStatus: 'SUCCESS' },
        { pose: 'LEFT', localUri: 'file://left.jpg', uploadedFileId: 'file-left', imageUrl: '/uploads/left.jpg', uploadStatus: 'SUCCESS' },
      ],
    }).success).toBe(false);
    expect(faceSchema.safeParse({
      faceImages: [
        { pose: 'FRONT', localUri: 'file://front.jpg', uploadedFileId: 'file-front', imageUrl: '/uploads/front.jpg', uploadStatus: 'SUCCESS' },
        { pose: 'LEFT', localUri: 'file://left.jpg', uploadedFileId: 'file-left', imageUrl: '/uploads/left.jpg', uploadStatus: 'SUCCESS' },
        { pose: 'RIGHT', localUri: 'file://right.jpg', uploadedFileId: 'file-right', imageUrl: '/uploads/right.jpg', uploadStatus: 'SUCCESS' },
      ],
    }).success).toBe(true);
  });
});

describe('phase 2 permission and privacy helpers', () => {
  it('checks exact permissions from the authenticated user', () => {
    const user = { ...makeUser(['ADMIN']), permissions: ['user.read', 'department.create'] };
    expect(hasPermission(user, 'department.create')).toBe(true);
    expect(hasPermission(user, 'department.delete')).toBe(false);
  });

  it('checks any permission without expanding roles on mobile', () => {
    const user = { ...makeUser(['LEADER']), permissions: ['approval.approve'] };
    expect(hasAnyPermission(user, ['approval.reject', 'approval.approve'])).toBe(true);
    expect(hasAnyPermission(user, ['role.assign', 'department.delete'])).toBe(false);
  });

  it('masks phone and id card values before rendering sensitive details', () => {
    expect(maskPhone('0901234567')).toBe('090***567');
    expect(maskIdCard('123456789012')).toBe('********9012');
  });

  it('does not expand roles or positions locally', () => {
    expect(hasPermission(makeUser(['EMPLOYEE']), 'position.create')).toBe(false);
  });
});

describe('phase 2 api adapters', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('access-token');
  });

  afterEach(() => {
    if (originalAdapter) {
      apiClient.defaults.adapter = originalAdapter;
    } else {
      delete apiClient.defaults.adapter;
    }
    jest.clearAllMocks();
  });

  it('loads department list from the backend departments endpoint', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('get');
      expect(config.url).toBe('/departments');
      expect(config.params).toEqual({ search: 'ops' });
      return dataResponse(config, { items: [{ id: 'department-1', companyId: 'company-1', code: 'OPS', name: 'Operations', isActive: true }] });
    });

    await expect(getDepartments({ search: 'ops', page: 2, limit: 10 })).resolves.toMatchObject({
      items: [{ code: 'OPS' }],
      pagination: { page: 2, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('loads a department detail without client-side fallback data', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/departments/department-1');
      return dataResponse(config, { id: 'department-1', companyId: 'company-1', code: 'OPS', name: 'Operations', isActive: true });
    });

    await expect(getDepartment('department-1')).resolves.toMatchObject({ id: 'department-1', code: 'OPS' });
  });

  it('creates a department through backend DTO fields', async () => {
    const payload = { companyId: 'company-1', code: 'OPS', name: 'Operations' };
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('post');
      expect(config.url).toBe('/departments');
      expect(JSON.parse(String(config.data))).toEqual(payload);
      return dataResponse(config, { id: 'department-1', ...payload, isActive: true });
    });

    await expect(createDepartment(payload)).resolves.toMatchObject({ id: 'department-1', name: 'Operations' });
  });

  it('updates a department through the backend patch endpoint', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('patch');
      expect(config.url).toBe('/departments/department-1');
      expect(JSON.parse(String(config.data))).toEqual({ name: 'Operations 2' });
      return dataResponse(config, { id: 'department-1', companyId: 'company-1', code: 'OPS', name: 'Operations 2', isActive: true });
    });

    await expect(updateDepartment('department-1', { name: 'Operations 2' })).resolves.toMatchObject({ name: 'Operations 2' });
  });

  it('loads positions from the real backend positions endpoint', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('get');
      expect(config.url).toBe('/positions');
      expect(config.params).toMatchObject({ departmentId: 'department-1', isActive: true, page: 1, limit: 100 });
      return dataResponse(config, {
        items: [{ id: 'position-1', departmentId: 'department-1', code: 'LEAD', name: 'Leader', isActive: true }],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      });
    });

    await expect(getPositions({ departmentId: 'department-1', isActive: true, page: 1, limit: 100 })).resolves.toMatchObject({
      items: [{ id: 'position-1', code: 'LEAD' }],
    });
  });

  it('uploads a face registration file and returns backend file references', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('post');
      expect(config.url).toBe('/uploads');
      expect(config.data).toBeInstanceOf(FormData);
      return dataResponse(config, {
        fileId: 'file-front',
        fileUrl: '/uploads/face/front.jpg',
        mimeType: 'image/jpeg',
        size: 123,
        purpose: 'FACE_REGISTRATION',
      });
    });

    await expect(uploadFile({
      uri: 'file://front.jpg',
      name: 'front.jpg',
      mimeType: 'image/jpeg',
      purpose: 'FACE_REGISTRATION',
    })).resolves.toMatchObject({ fileId: 'file-front', fileUrl: '/uploads/face/front.jpg' });
  });

  it('loads admin employee list from /admin/users', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/admin/users');
      expect(config.params).toMatchObject({ search: 'movie', page: 1, limit: 20 });
      return dataResponse(config, {
        items: [{ id: 'user-1', userCode: 'USR001', phone: '0900000000', accountStatus: 'ACTIVE', approvalStatus: 'APPROVED', isActive: true }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    await expect(getEmployees({ search: 'movie', page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'user-1' }] });
  });

  it('loads admin employee detail and sends basic edit patches only to /admin/users/:id', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/admin/users/user-1');
        return dataResponse(config, { id: 'user-1', userCode: 'USR001', phone: '0900000000', accountStatus: 'ACTIVE', approvalStatus: 'APPROVED', isActive: true });
      }
      expect(config.method).toBe('patch');
      expect(config.url).toBe('/admin/users/user-1');
      expect(JSON.parse(String(config.data))).toEqual({ fullName: 'Updated User', phone: '0911111111' });
      return dataResponse(config, { id: 'user-1', userCode: 'USR001', phone: '0911111111', accountStatus: 'ACTIVE', approvalStatus: 'APPROVED', isActive: true });
    });

    await expect(getAdminUser('user-1')).resolves.toMatchObject({ id: 'user-1' });
    await expect(updateEmployee('user-1', { fullName: 'Updated User', phone: '0911111111' })).resolves.toMatchObject({ phone: '0911111111' });
  });

  it('loads leader-scoped employees through /reports/employees', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/reports/employees');
      expect(config.params).toMatchObject({ search: 'user', page: 1, limit: 10 });
      return dataResponse(config, [{ userCode: 'USR001', fullName: 'Scoped User', department: 'Operations', accountStatus: 'ACTIVE' }]);
    });

    await expect(getEmployeeReport({ search: 'user', page: 1, limit: 10 })).resolves.toMatchObject({
      items: [{ fullName: 'Scoped User' }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('loads account approvals using backend filters', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/approvals/accounts');
      expect(config.params).toMatchObject({ status: 'PENDING', page: 1, limit: 20 });
      return dataResponse(config, {
        items: [{ id: 'approval-1', status: 'PENDING', requestedDepartmentId: 'department-1', createdAt: '2026-07-05T00:00:00.000Z' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    await expect(getApprovals({ status: 'PENDING', page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'approval-1' }] });
  });

  it('approves and rejects account approvals through explicit action endpoints', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/approvals/accounts/approval-1/approve');
        return dataResponse(config, { id: 'approval-1', status: 'APPROVED' });
      }
      expect(config.url).toBe('/approvals/accounts/approval-2/reject');
      expect(JSON.parse(String(config.data))).toEqual({ reason: 'Missing documents' });
      return dataResponse(config, { id: 'approval-2', status: 'REJECTED' });
    });

    await expect(approveAccount('approval-1')).resolves.toEqual({ id: 'approval-1', status: 'APPROVED' });
    await expect(rejectAccount('approval-2', { reason: 'Missing documents' })).resolves.toEqual({ id: 'approval-2', status: 'REJECTED' });
  });

  it('assigns a leader without creating a mobile-side role system', async () => {
    const payload = { userId: 'user-1', departmentId: 'department-1', primary: true };
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/admin/leader-assignments');
      expect(JSON.parse(String(config.data))).toEqual(payload);
      return dataResponse(config, { id: 'assignment-1', userId: 'user-1', roleId: 'role-leader', scopeType: 'DEPARTMENT', scopeId: 'department-1' });
    });

    await expect(assignLeader(payload)).resolves.toMatchObject({ scopeType: 'DEPARTMENT', scopeId: 'department-1' });
  });
});

function makeAdapter(handler: (config: InternalAxiosRequestConfig) => AxiosResponse): AxiosAdapter {
  return async (config) => handler(config);
}

function dataResponse<T>(config: InternalAxiosRequestConfig, data: T): AxiosResponse {
  return {
    config,
    data: { success: true, data },
    headers: {},
    status: 200,
    statusText: 'OK',
  };
}
