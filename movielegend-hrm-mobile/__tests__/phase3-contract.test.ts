import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../src/api/client';
import { checkIn, checkOut, createAttendanceAdjustment, getActiveAttendanceLocations, getAttendanceDetail, getAttendanceHistory, getCurrentAttendance } from '../src/api/attendance.api';
import { createEmployeeRequest, getEmployeeRequests, getMyEmployeeRequests } from '../src/api/employee-requests.api';
import { approveLeaveRequest, createLeaveRequest, getLeaveRequests, getLeaveTypes, rejectLeaveRequest } from '../src/api/leave.api';
import { approveOvertimeRequest, createOvertimeRequest, getMyOvertimeRequests, getPendingOvertimeRequests, rejectOvertimeRequest } from '../src/api/overtime.api';
import { assignShift, createShift, createShiftSwap, getMySchedule, getShifts } from '../src/api/shifts.api';
import { uploadFile } from '../src/api/uploads.api';
import { deriveAttendanceUiState, findTodayShift, mapAttendanceError, shouldRecoverAttendanceState } from '../src/features/attendance/attendance.logic';
import { distanceMeters, isValidCoordinates, locationReadiness } from '../src/features/location/location.logic';
import { businessDateToday, formatShiftRange, isOvernightShift } from '../src/utils/date-time';

describe('phase 3 shift and time behavior', () => {
  it('displays today shift from assigned schedule', () => {
    const today = businessDateToday(new Date('2026-07-05T02:00:00.000Z'));
    expect(findTodayShift([{ id: 'a1', userId: 'u1', departmentId: 'd1', shiftId: 's1', workDate: today, status: 'ASSIGNED' }], today)?.id).toBe('a1');
  });

  it('formats overnight shift with next-day indicator', () => {
    expect(formatShiftRange('22:00', '06:00')).toBe('22:00 - 06:00 (+1)');
  });

  it('detects non-overnight shift', () => {
    expect(isOvernightShift('08:00', '17:00')).toBe(false);
  });

  it('detects no shift empty state input', () => {
    expect(findTodayShift([], '2026-07-05')).toBeNull();
  });

  it('builds leader scoped assignment payload against backend endpoint', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('post');
      expect(config.url).toBe('/shift-assignments');
      expect(JSON.parse(String(config.data))).toEqual({ userId: 'u1', departmentId: 'd1', shiftId: 's1', workDate: '2026-07-05' });
      return dataResponse(config, { id: 'a1' });
    });
    await expect(assignShift({ userId: 'u1', departmentId: 'd1', shiftId: 's1', workDate: '2026-07-05' })).resolves.toEqual({ id: 'a1' });
  });
});

describe('phase 3 GPS behavior', () => {
  it('accepts valid GPS coordinates', () => {
    expect(isValidCoordinates({ latitude: 10.77, longitude: 106.7, accuracy: 12 })).toBe(true);
  });

  it('rejects invalid GPS coordinates', () => {
    expect(isValidCoordinates({ latitude: 100, longitude: 106.7 })).toBe(false);
  });

  it('reports permission denied state', () => {
    expect(locationReadiness(null, false)).toBe('denied');
  });

  it('reports GPS fetch success state', () => {
    expect(locationReadiness({ latitude: 10, longitude: 106, accuracy: 20 }, true)).toBe('ready');
  });

  it('warns for low accuracy', () => {
    expect(locationReadiness({ latitude: 10, longitude: 106, accuracy: 120 }, true)).toBe('low_accuracy');
  });

  it('calculates estimated map distance without becoming source of truth', () => {
    expect(distanceMeters({ latitude: 10, longitude: 106 }, { latitude: 10.001, longitude: 106 })).toBeGreaterThan(100);
  });
});

describe('phase 3 attendance state and error mapping', () => {
  it.each([
    [{ checkInAt: null, checkOutAt: null, status: 'MISSING' }, 'NONE'],
    [{ checkInAt: '2026-07-05T01:00:00.000Z', checkOutAt: null, status: 'CHECKED_IN' }, 'CHECKED_IN'],
    [{ checkInAt: '2026-07-05T01:00:00.000Z', checkOutAt: '2026-07-05T09:00:00.000Z', status: 'CHECKED_OUT' }, 'CHECKED_OUT'],
  ])('derives attendance UI state %#', (record, expected) => {
    expect(deriveAttendanceUiState(record as never)).toBe(expected);
  });

  it.each([
    'ALREADY_CHECKED_IN',
    'OUTSIDE_ATTENDANCE_RADIUS',
    'SHIFT_ASSIGNMENT_NOT_FOUND',
    'TOO_EARLY_TO_CHECK_IN',
    'INVALID_WIFI',
    'FACE_VERIFICATION_FAILED',
    'FACE_PROFILE_NOT_READY',
    'NOT_CHECKED_IN',
    'ALREADY_CHECKED_OUT',
  ])('maps backend attendance error %s', (code) => {
    expect(mapAttendanceError(code, 'fallback')).not.toBe('fallback');
  });

  it('falls back for unknown business error', () => {
    expect(mapAttendanceError('UNKNOWN_ATTENDANCE_ERROR', 'fallback')).toBe('fallback');
  });

  it.each(['TIMEOUT', 'NETWORK_ERROR', 'ALREADY_CHECKED_IN', 'ALREADY_CHECKED_OUT'])('refreshes state after ambiguous %s', (code) => {
    expect(shouldRecoverAttendanceState(code)).toBe(true);
  });
});

describe('phase 3 API adapters', () => {
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

  it('loads shifts from /shifts', async () => {
    apiClient.defaults.adapter = endpoint('get', '/shifts', [{ id: 's1' }]);
    await expect(getShifts()).resolves.toEqual([{ id: 's1' }]);
  });

  it('creates shifts with backend DTO fields', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/shifts');
      expect(JSON.parse(String(config.data))).toMatchObject({ code: 'DAY', name: 'Day', startTime: '08:00', endTime: '17:00' });
      return dataResponse(config, { id: 's1' });
    });
    await expect(createShift({ code: 'DAY', name: 'Day', startTime: '08:00', endTime: '17:00' })).resolves.toEqual({ id: 's1' });
  });

  it('loads employee schedule from /shift-assignments/me', async () => {
    apiClient.defaults.adapter = endpoint('get', '/shift-assignments/me', [{ id: 'a1' }]);
    await expect(getMySchedule()).resolves.toEqual([{ id: 'a1' }]);
  });

  it('creates shift swap request with actual backend DTO', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/shift-assignments/swaps');
      expect(JSON.parse(String(config.data))).toEqual({ targetUserId: 'u2', fromShiftId: 's1', toShiftId: 's2', fromDate: '2026-07-05', toDate: '2026-07-06', reason: 'Need swap' });
      return dataResponse(config, { id: 'swap1' });
    });
    await expect(createShiftSwap({ targetUserId: 'u2', fromShiftId: 's1', toShiftId: 's2', fromDate: '2026-07-05', toDate: '2026-07-06', reason: 'Need swap' })).resolves.toEqual({ id: 'swap1' });
  });

  it('uploads attendance photo through shared upload client', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/uploads');
      expect(config.data).toBeInstanceOf(FormData);
      return dataResponse(config, { fileId: 'f1', fileUrl: '/uploads/attendance/f1.jpg', purpose: 'ATTENDANCE', mimeType: 'image/jpeg', size: 100 });
    });
    await expect(uploadFile({ uri: 'file://checkin.jpg', name: 'checkin.jpg', mimeType: 'image/jpeg', purpose: 'ATTENDANCE' })).resolves.toMatchObject({ fileId: 'f1' });
  });

  it('submits check-in with GPS and photoFileId', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/attendance/check-in');
      expect(JSON.parse(String(config.data))).toEqual({ workDate: '2026-07-05', latitude: 10.77, longitude: 106.7, accuracy: 15, photoFileId: 'f1' });
      return dataResponse(config, { id: 'r1', status: 'CHECKED_IN' });
    });
    await expect(checkIn({ workDate: '2026-07-05', latitude: 10.77, longitude: 106.7, accuracy: 15, photoFileId: 'f1' })).resolves.toMatchObject({ id: 'r1' });
  });

  it('submits checkout with GPS only per backend DTO', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/attendance/check-out');
      expect(JSON.parse(String(config.data))).toEqual({ latitude: 10.77, longitude: 106.7 });
      return dataResponse(config, { id: 'r1', status: 'CHECKED_OUT' });
    });
    await expect(checkOut({ latitude: 10.77, longitude: 106.7 })).resolves.toMatchObject({ status: 'CHECKED_OUT' });
  });

  it('loads current attendance from contract endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/attendance/current', { state: 'CHECKED_IN', attendance: { id: 'r1' } });
    await expect(getCurrentAttendance()).resolves.toMatchObject({ state: 'CHECKED_IN', attendance: { id: 'r1' } });
  });

  it('loads own attendance history from paginated /attendance/my', async () => {
    apiClient.defaults.adapter = endpoint('get', '/attendance/my', { items: [{ id: 'r1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getAttendanceHistory({ page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'r1' }], pagination: { page: 1, limit: 20 } });
  });

  it('loads attendance detail from /attendance/:id', async () => {
    apiClient.defaults.adapter = endpoint('get', '/attendance/r1', { id: 'r1', workedMinutes: 480 });
    await expect(getAttendanceDetail('r1')).resolves.toMatchObject({ id: 'r1', workedMinutes: 480 });
  });

  it('loads active attendance locations for map target', async () => {
    apiClient.defaults.adapter = endpoint('get', '/attendance/locations/active', [{ id: 'loc1', latitude: 10, longitude: 106, radiusMeters: 100 }]);
    await expect(getActiveAttendanceLocations()).resolves.toEqual([{ id: 'loc1', latitude: 10, longitude: 106, radiusMeters: 100 }]);
  });

  it('creates attendance adjustment request', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/attendance/adjustments');
      expect(JSON.parse(String(config.data))).toMatchObject({ attendanceRecordId: 'r1', reason: 'Forgot checkout' });
      return dataResponse(config, { id: 'adj1' });
    });
    await expect(createAttendanceAdjustment({ attendanceRecordId: 'r1', reason: 'Forgot checkout' })).resolves.toEqual({ id: 'adj1' });
  });

  it('creates leave request with actual DTO', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/leave-requests');
      expect(JSON.parse(String(config.data))).toEqual({ leaveTypeId: 'lt1', startDate: '2026-07-05', endDate: '2026-07-06', reason: 'Family' });
      return dataResponse(config, { id: 'lv1' });
    });
    await expect(createLeaveRequest({ leaveTypeId: 'lt1', startDate: '2026-07-05', endDate: '2026-07-06', reason: 'Family' })).resolves.toEqual({ id: 'lv1' });
  });

  it('loads active leave types from /leave/types', async () => {
    apiClient.defaults.adapter = endpoint('get', '/leave/types', [{ id: 'lt1', code: 'AL', name: 'Annual leave' }]);
    await expect(getLeaveTypes()).resolves.toEqual([{ id: 'lt1', code: 'AL', name: 'Annual leave' }]);
  });

  it('loads leave history and leader approval list from same backend endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/leave-requests', [{ id: 'lv1' }]);
    await expect(getLeaveRequests()).resolves.toEqual([{ id: 'lv1' }]);
  });

  it('approves and rejects leave request', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/leave-requests/lv1/approve');
        return dataResponse(config, { id: 'lv1', status: 'APPROVED' });
      }
      expect(config.url).toBe('/leave-requests/lv2/reject');
      return dataResponse(config, { id: 'lv2', status: 'REJECTED' });
    });
    await expect(approveLeaveRequest('lv1')).resolves.toMatchObject({ status: 'APPROVED' });
    await expect(rejectLeaveRequest('lv2', { reason: 'No balance' })).resolves.toMatchObject({ status: 'REJECTED' });
  });

  it('creates overtime request', async () => {
    apiClient.defaults.adapter = endpoint('post', '/overtime-requests', { id: 'ot1' });
    await expect(createOvertimeRequest({ workDate: '2026-07-05', startAt: '2026-07-05T11:00:00.000Z', endAt: '2026-07-05T13:00:00.000Z', reason: 'Release' })).resolves.toEqual({ id: 'ot1' });
  });

  it('loads own overtime history', async () => {
    apiClient.defaults.adapter = endpoint('get', '/overtime/requests/my', { items: [{ id: 'ot1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getMyOvertimeRequests({ page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'ot1' }] });
  });

  it('loads leader pending overtime list', async () => {
    apiClient.defaults.adapter = endpoint('get', '/overtime/requests/pending', { items: [{ id: 'ot1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getPendingOvertimeRequests({ status: 'PENDING', page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'ot1' }] });
  });

  it('approves overtime by ID because backend lacks list endpoint', async () => {
    apiClient.defaults.adapter = endpoint('post', '/overtime-requests/ot1/approve', { id: 'ot1', status: 'APPROVED' });
    await expect(approveOvertimeRequest('ot1')).resolves.toMatchObject({ status: 'APPROVED' });
  });

  it('rejects overtime with required reason', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/overtime/requests/ot1/reject');
      expect(JSON.parse(String(config.data))).toEqual({ reason: 'No coverage' });
      return dataResponse(config, { id: 'ot1', status: 'REJECTED' });
    });
    await expect(rejectOvertimeRequest('ot1', { reason: 'No coverage' })).resolves.toMatchObject({ status: 'REJECTED' });
  });

  it('creates generic employee request', async () => {
    apiClient.defaults.adapter = endpoint('post', '/employee-requests', { id: 'er1' });
    await expect(createEmployeeRequest({ type: 'OTHER', title: 'Need support', content: 'Please review' })).resolves.toEqual({ id: 'er1' });
  });

  it('loads employee request history only through backend approval endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/employee-requests', [{ id: 'er1' }]);
    await expect(getEmployeeRequests()).resolves.toEqual([{ id: 'er1' }]);
  });

  it('loads own employee request history from /employee-requests/my', async () => {
    apiClient.defaults.adapter = endpoint('get', '/employee-requests/my', { items: [{ id: 'er1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getMyEmployeeRequests({ page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'er1' }] });
  });
});

function endpoint(method: string, url: string, payload: unknown): AxiosAdapter {
  return makeAdapter((config) => {
    expect(config.method).toBe(method);
    expect(config.url).toBe(url);
    return dataResponse(config, payload);
  });
}

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
