import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../src/api/client';
import {
  cancelTask,
  createTask,
  createTaskAttachment,
  createTaskComment,
  createTaskExtensionRequest,
  getMyTasks,
  getTask,
  getTasks,
  updateTask,
} from '../src/api/tasks.api';
import {
  acceptTaskAssignment,
  approveTaskAssignment,
  rejectTaskAssignment,
  startTaskAssignment,
  submitTaskAssignment,
  updateTaskAssignmentProgress,
} from '../src/api/task-assignments.api';
import { approveTaskExtension, rejectTaskExtension } from '../src/api/task-extensions.api';
import { addTaskGroupMember, createTaskGroup, getTaskGroups, removeTaskGroupMember } from '../src/api/task-groups.api';
import {
  createCrossDepartmentRequest,
  getCrossDepartmentRequest,
  getCrossDepartmentRequests,
  sourceApproveCrossDepartmentRequest,
  sourceRejectCrossDepartmentRequest,
  targetAcceptCrossDepartmentRequest,
  targetRejectCrossDepartmentRequest,
} from '../src/api/cross-department.api';
import { registerDeviceToken, revokeDeviceToken } from '../src/api/device-tokens.api';
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../src/api/notifications.api';
import { getScopedEmployees } from '../src/api/employees.api';
import { getTaskGroup } from '../src/api/task-groups.api';
import { getPendingTaskExtensions, getTaskReviewQueue, getTaskTimeline } from '../src/api/tasks.api';
import {
  canAcceptAssignment,
  canStartAssignment,
  canSubmitAssignment,
  canUpdateProgress,
  isOverdue,
  mapTaskError,
  notificationRoute,
  taskDeadlineLabel,
} from '../src/features/tasks/task.logic';
import type { NotificationTargetDto } from '../src/types/notification.types';

describe('task phase API contract', () => {
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

  it('loads employee own tasks from /tasks/me with backend filter params', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.method).toBe('get');
      expect(config.url).toBe('/tasks/me');
      expect(config.params).toMatchObject({ status: 'IN_PROGRESS', page: 1, limit: 20 });
      return dataResponse(config, [{ id: 't1' }]);
    });
    await expect(getMyTasks({ status: 'IN_PROGRESS', page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 't1' }] });
  });

  it('loads leader/admin tasks from /tasks with department scope param', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/tasks');
      expect(config.params).toMatchObject({ departmentId: 'd1', search: 'release' });
      return dataResponse(config, [{ id: 't1' }]);
    });
    await expect(getTasks({ departmentId: 'd1', search: 'release' })).resolves.toMatchObject({ items: [{ id: 't1' }] });
  });

  it('loads task detail from /tasks/:id', async () => {
    apiClient.defaults.adapter = endpoint('get', '/tasks/t1', { id: 't1', title: 'Task' });
    await expect(getTask('t1')).resolves.toMatchObject({ id: 't1' });
  });

  it('creates one task with multiple backend targets instead of N calls', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/tasks');
      expect(JSON.parse(String(config.data))).toMatchObject({
        title: 'Deploy',
        targets: [
          { targetType: 'USER', targetId: 'u1' },
          { targetType: 'DEPARTMENT', targetId: 'd1' },
          { targetType: 'GROUP', targetId: 'g1' },
        ],
      });
      return dataResponse(config, { id: 't1' });
    });
    await expect(createTask({ title: 'Deploy', targets: [{ targetType: 'USER', targetId: 'u1' }, { targetType: 'DEPARTMENT', targetId: 'd1' }, { targetType: 'GROUP', targetId: 'g1' }] })).resolves.toEqual({ id: 't1' });
  });

  it.each([
    ['patch', '/tasks/t1', () => updateTask('t1', { title: 'New' })],
    ['patch', '/tasks/t1/cancel', () => cancelTask('t1')],
    ['patch', '/task-assignments/a1/accept', () => acceptTaskAssignment('a1')],
    ['patch', '/task-assignments/a1/start', () => startTaskAssignment('a1')],
    ['patch', '/task-assignments/a1/submit', () => submitTaskAssignment('a1', { completionNote: 'done' })],
    ['patch', '/task-assignments/a1/approve', () => approveTaskAssignment('a1', { note: 'ok' })],
    ['patch', '/task-assignments/a1/reject', () => rejectTaskAssignment('a1', { note: 'fix' })],
  ])('calls %s %s', async (method, url, fn) => {
    apiClient.defaults.adapter = endpoint(method, url, { id: 'ok' });
    await expect(fn()).resolves.toEqual({ id: 'ok' });
  });

  it('updates progress with progressPercent and does not complete locally', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/task-assignments/a1/progress');
      expect(JSON.parse(String(config.data))).toEqual({ progressPercent: 100 });
      return dataResponse(config, { id: 'a1', status: 'IN_PROGRESS', progressPercent: 100 });
    });
    await expect(updateTaskAssignmentProgress('a1', { progressPercent: 100 })).resolves.toMatchObject({ status: 'IN_PROGRESS' });
  });

  it('posts comments through task comment endpoint', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/tasks/t1/comments');
      expect(JSON.parse(String(config.data))).toEqual({ content: 'hello' });
      return dataResponse(config, { id: 'c1' });
    });
    await expect(createTaskComment('t1', { content: 'hello' })).resolves.toEqual({ id: 'c1' });
  });

  it('attaches uploaded metadata using actual backend DTO', async () => {
    apiClient.defaults.adapter = makeAdapter((config) => {
      expect(config.url).toBe('/tasks/t1/attachments');
      expect(JSON.parse(String(config.data))).toEqual({ fileName: 'spec.pdf', fileUrl: '/uploads/f1.pdf', mimeType: 'application/pdf', sizeBytes: 100, type: 'FILE' });
      return dataResponse(config, { id: 'att1' });
    });
    await expect(createTaskAttachment('t1', { fileName: 'spec.pdf', fileUrl: '/uploads/f1.pdf', mimeType: 'application/pdf', sizeBytes: 100, type: 'FILE' })).resolves.toEqual({ id: 'att1' });
  });

  it('creates and reviews extension requests through backend endpoints', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/tasks/t1/extensions');
        return dataResponse(config, { id: 'e1', status: 'PENDING' });
      }
      if (step === 2) {
        expect(config.url).toBe('/task-extensions/e1/approve');
        return dataResponse(config, { id: 'e1', status: 'APPROVED' });
      }
      expect(config.url).toBe('/task-extensions/e2/reject');
      return dataResponse(config, { id: 'e2', status: 'REJECTED' });
    });
    await expect(createTaskExtensionRequest('t1', { assignmentId: 'a1', requestedDueAt: '2026-07-09T00:00:00.000Z', reason: 'Need more time' })).resolves.toMatchObject({ status: 'PENDING' });
    await expect(approveTaskExtension('e1')).resolves.toMatchObject({ status: 'APPROVED' });
    await expect(rejectTaskExtension('e2', { note: 'No' })).resolves.toMatchObject({ status: 'REJECTED' });
  });

  it('manages task groups through actual endpoints', async () => {
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      step += 1;
      if (step === 1) {
        expect(config.url).toBe('/task-groups');
        return dataResponse(config, [{ id: 'g1' }]);
      }
      if (step === 2) {
        expect(config.method).toBe('post');
        expect(config.url).toBe('/task-groups');
        return dataResponse(config, { id: 'g1' });
      }
      if (step === 3) {
        expect(config.url).toBe('/task-groups/g1/members');
        return dataResponse(config, { id: 'm1' });
      }
      expect(config.method).toBe('delete');
      expect(config.url).toBe('/task-groups/g1/members/u1');
      return dataResponse(config, { count: 1 });
    });
    await expect(getTaskGroups()).resolves.toMatchObject({ items: [{ id: 'g1' }] });
    await expect(createTaskGroup({ departmentId: 'd1', name: 'Ops' })).resolves.toEqual({ id: 'g1' });
    await expect(addTaskGroupMember('g1', { userId: 'u1' })).resolves.toEqual({ id: 'm1' });
    await expect(removeTaskGroupMember('g1', 'u1')).resolves.toEqual({ count: 1 });
  });

  it('runs cross-department flow endpoints', async () => {
    const endpoints = [
      ['get', '/cross-department-requests'],
      ['post', '/cross-department-requests'],
      ['patch', '/cross-department-requests/r1/source-approve'],
      ['patch', '/cross-department-requests/r1/source-reject'],
      ['patch', '/cross-department-requests/r1/target-accept'],
      ['patch', '/cross-department-requests/r1/target-reject'],
    ];
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      const [method, url] = endpoints[step++] ?? [];
      expect(config.method).toBe(method);
      expect(config.url).toBe(url);
      return dataResponse(config, step === 1 ? [{ id: 'r1' }] : { id: 'r1' });
    });
    await expect(getCrossDepartmentRequests()).resolves.toMatchObject({ items: [{ id: 'r1' }] });
    await expect(createCrossDepartmentRequest({ sourceDepartmentId: 'd1', targetDepartmentId: 'd2', title: 'Help', content: 'Need support' })).resolves.toEqual({ id: 'r1' });
    await expect(sourceApproveCrossDepartmentRequest('r1')).resolves.toEqual({ id: 'r1' });
    await expect(sourceRejectCrossDepartmentRequest('r1', { reason: 'No' })).resolves.toEqual({ id: 'r1' });
    await expect(targetAcceptCrossDepartmentRequest('r1')).resolves.toEqual({ id: 'r1' });
    await expect(targetRejectCrossDepartmentRequest('r1', { reason: 'No capacity' })).resolves.toEqual({ id: 'r1' });
  });

  it('loads cross-department detail from backend detail endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/cross-department-requests/r2', { id: 'r2' });
    await expect(getCrossDepartmentRequest('r2')).resolves.toEqual({ id: 'r2' });
  });

  it('loads task timeline from backend timeline endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/tasks/t1/timeline', { items: [{ id: 'h1', type: 'STATUS_CHANGED' }], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } });
    await expect(getTaskTimeline('t1', { page: 1, limit: 50 })).resolves.toMatchObject({ items: [{ id: 'h1' }] });
  });

  it('loads review queue from dedicated endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/task-assignments/review-queue', { items: [{ assignmentId: 'a1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getTaskReviewQueue({ page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ assignmentId: 'a1' }] });
  });

  it('loads pending extension queue from dedicated endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/task-extensions/pending', { items: [{ id: 'e1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getPendingTaskExtensions({ page: 1, limit: 20 })).resolves.toMatchObject({ items: [{ id: 'e1' }] });
  });

  it('loads task group detail from backend detail endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/task-groups/g1', { id: 'g1' });
    await expect(getTaskGroup('g1')).resolves.toEqual({ id: 'g1' });
  });

  it('loads leader USER target options from scoped employee endpoint', async () => {
    apiClient.defaults.adapter = endpoint('get', '/employees/scoped', { items: [{ id: 'u1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    await expect(getScopedEmployees({ page: 1, limit: 20, departmentId: 'd1' })).resolves.toMatchObject({ items: [{ id: 'u1' }] });
  });

  it('uses notification and device token endpoints', async () => {
    const endpoints = [
      ['get', '/notifications/me', [{ id: 'nt1' }]],
      ['get', '/notifications/unread-count', 2],
      ['patch', '/notifications/n1/read', { id: 'nt1' }],
      ['patch', '/notifications/read-all', { count: 2 }],
      ['post', '/notifications/device-tokens', { id: 'dt1' }],
      ['delete', '/notifications/device-tokens/dt1', { count: 1 }],
    ] as const;
    let step = 0;
    apiClient.defaults.adapter = makeAdapter((config) => {
      const [method, url, payload] = endpoints[step++]!;
      expect(config.method).toBe(method);
      expect(config.url).toBe(url);
      return dataResponse(config, payload);
    });
    await expect(getMyNotifications()).resolves.toEqual([{ id: 'nt1' }]);
    await expect(getUnreadNotificationCount()).resolves.toBe(2);
    await expect(markNotificationRead('n1')).resolves.toEqual({ id: 'nt1' });
    await expect(markAllNotificationsRead()).resolves.toEqual({ count: 2 });
    await expect(registerDeviceToken({ token: 'ExpoPushToken', platform: 'ANDROID', deviceId: 'android' })).resolves.toEqual({ id: 'dt1' });
    await expect(revokeDeviceToken('dt1')).resolves.toEqual({ count: 1 });
  });
});

describe('task phase state, error, and navigation logic', () => {
  it.each([
    ['NEW', true, false, false, false],
    ['ACCEPTED', false, true, true, false],
    ['IN_PROGRESS', false, false, true, true],
    ['WAITING_REVIEW', false, false, false, false],
  ] as const)('derives actions for assignment status %s', (status, accept, start, progress, submit) => {
    expect(canAcceptAssignment(status)).toBe(accept);
    expect(canStartAssignment(status)).toBe(start);
    expect(canUpdateProgress(status)).toBe(progress);
    expect(canSubmitAssignment(status)).toBe(submit);
  });

  it('does not mark completed task overdue', () => {
    expect(isOverdue('2026-07-01T00:00:00.000Z', 'COMPLETED', new Date('2026-07-06T00:00:00.000Z'))).toBe(false);
  });

  it('marks active past due task overdue', () => {
    expect(isOverdue('2026-07-01T00:00:00.000Z', 'IN_PROGRESS', new Date('2026-07-06T00:00:00.000Z'))).toBe(true);
  });

  it('formats due labels from a central minute ticker compatible helper', () => {
    expect(taskDeadlineLabel('2026-07-06T01:00:00.000Z', new Date('2026-07-06T00:00:00.000Z'))).toContain('Due in');
  });

  it.each([
    'TASK_NOT_FOUND',
    'TASK_ASSIGNMENT_NOT_FOUND',
    'TASK_TARGET_EMPTY',
    'TASK_ASSIGNMENT_MISMATCH',
    'TASK_FORBIDDEN',
    'TASK_EXTENSION_NOT_FOUND',
    'INVALID_EXTENSION_DUE_AT',
    'TASK_EXTENSION_ALREADY_PROCESSED',
    'FORBIDDEN_DEPARTMENT_SCOPE',
    'CROSS_DEPARTMENT_REQUEST_NOT_FOUND',
    'INVALID_CROSS_DEPARTMENT_STATUS',
    'NOTIFICATION_NOT_FOUND',
  ])('maps backend error code %s without parsing message', (code) => {
    expect(mapTaskError(code, 'fallback')).not.toBe('fallback');
  });

  it('falls back for unknown task error', () => {
    expect(mapTaskError('UNKNOWN', 'fallback')).toBe('fallback');
  });

  it('deep links task notifications by role route', () => {
    const target = notificationTarget({ type: 'TASK_ASSIGNED', taskId: 't1' });
    expect(notificationRoute(target, user(['EMPLOYEE']))).toBe('/employee/tasks/t1');
    expect(notificationRoute(target, user(['LEADER']))).toBe('/leader/tasks/t1');
    expect(notificationRoute(target, user(['ADMIN']))).toBe('/admin/tasks/t1');
  });

  it('deep links cross-department notifications from metadata', () => {
    const target = notificationTarget({ type: 'CROSS_DEPARTMENT_UPDATED', metadata: { requestId: 'r1' } });
    expect(notificationRoute(target, user(['LEADER']))).toBe('/leader/cross-department/r1');
  });

  it('deep links newsfeed and comment notifications to post detail screen', () => {
    const commentTarget = notificationTarget({ type: 'SYSTEM', title: 'Bình luận mới về bài viết của bạn', metadata: { postId: 'post-123', action: 'COMMENT' } });
    expect(notificationRoute(commentTarget, user(['EMPLOYEE']))).toBe('/employee/newsfeed/post-123');
    expect(notificationRoute(commentTarget, user(['LEADER']))).toBe('/leader/newsfeed/post-123');
    expect(notificationRoute(commentTarget, user(['ADMIN']))).toBe('/admin/newsfeed/post-123');

    const postTarget = notificationTarget({ type: 'NEWSFEED_POST_APPROVED', metadata: { postId: 'post-123' } });
    expect(notificationRoute(postTarget, user(['EMPLOYEE']))).toBe('/employee/newsfeed/post-123');
  });

  it('falls back safely for unsupported modules', () => {
    const target = notificationTarget({ type: 'PAYSLIP_AVAILABLE', metadata: { payrollId: 'p1' } });
    expect(notificationRoute(target, user(['EMPLOYEE']))).toBeNull();
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

function notificationTarget(input: { type: NotificationTargetDto['notification']['type']; taskId?: string; metadata?: Record<string, unknown> }): NotificationTargetDto {
  return {
    id: 'nt1',
    notificationId: 'n1',
    userId: 'u1',
    readAt: null,
    createdAt: '2026-07-06T00:00:00.000Z',
    notification: {
      id: 'n1',
      type: input.type,
      title: 'Title',
      body: 'Body',
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      createdAt: '2026-07-06T00:00:00.000Z',
    },
  };
}

function user(roles: string[]) {
  return {
    id: 'u1',
    userCode: 'U1',
    fullName: 'User',
    phone: '090',
    roles,
    permissions: [],
    hasFaceData: true,
  };
}
