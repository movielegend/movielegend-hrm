import { ForbiddenException } from '@nestjs/common';
import { AccountStatus, RoleScopeType, TaskAssignmentStatus, TaskHistoryAction, TaskPriority, TaskStatus } from '@prisma/client';
import { CrossDepartmentService } from '../cross-department/cross-department.service';
import { EmployeesService } from '../employees/employees.service';
import { TaskGroupsService } from '../task-groups/task-groups.service';
import { TasksService } from './tasks.service';

const admin = actor('admin', ['ADMIN'], ['task.read_all', 'task.review_all', 'task.extension_review_all', 'cross_department.read_all']);
const leader = actor('leader', ['LEADER'], ['task.read_department', 'task.review_department', 'task.extension_review_department'], ['media']);
const employee = actor('employee', ['EMPLOYEE'], ['task.read_own']);

describe('Task contract closure', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let scope: ReturnType<typeof scopeMock>;
  let tasks: TasksService;

  beforeEach(() => {
    prisma = prismaMock();
    scope = scopeMock();
    tasks = new TasksService(prisma as never, scope as never, { assertAssignmentTransition: jest.fn() } as never, { createForUsers: jest.fn(), emitCreated: jest.fn() } as never);
  });

  it('employee own paginated list', async () => {
    await tasks.findMine(employee, q());
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    expect(prisma.task.count).toHaveBeenCalled();
  });

  it('leader department paginated list', async () => {
    await tasks.findAll(leader, q({ departmentId: 'media' }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ departmentContextId: 'media' }) }));
  });

  it('leader cannot query other department', async () => {
    scope.assertDepartmentAccess.mockImplementation(() => {
      throw new ForbiddenException();
    });
    await expect(tasks.findAll(leader, q({ departmentId: 'marketing' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin global list', async () => {
    await tasks.findAll(admin, q());
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });

  it('filters status', async () => {
    await tasks.findAll(admin, q({ status: TaskStatus.IN_PROGRESS }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: TaskStatus.IN_PROGRESS }) }));
  });

  it('filters priority', async () => {
    await tasks.findAll(admin, q({ priority: TaskPriority.HIGH }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ priority: TaskPriority.HIGH }) }));
  });

  it('filters overdue', async () => {
    await tasks.findAll(admin, q({ overdue: true }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ dueAt: expect.any(Object) }) }));
  });

  it('filters search', async () => {
    await tasks.findAll(admin, q({ search: 'deploy' }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }));
  });

  it('employee own task detail', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ createdByUserId: employee.userId }));
    await expect(tasks.findOne('task-1', employee)).resolves.toMatchObject({ id: 'task-1' });
  });

  it('employee unrelated task denied', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ createdByUserId: 'other', assignments: [] }));
    await expect(tasks.findOne('task-1', employee)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leader own department task detail', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ departmentContextId: 'media' }));
    await expect(tasks.findOne('task-1', leader)).resolves.toMatchObject({ id: 'task-1' });
  });

  it('leader cross department detail denied', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ departmentContextId: 'marketing', createdByUserId: 'other', assignments: [] }));
    await expect(tasks.findOne('task-1', leader)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leader own department review queue', async () => {
    prisma.taskAssignment.findMany.mockResolvedValue([assignment()]);
    prisma.taskAssignment.count.mockResolvedValue(1);
    await expect(tasks.reviewQueue(leader, queueQ())).resolves.toMatchObject({ pagination: { total: 1 } });
  });

  it('leader cross department review queue denied', async () => {
    scope.assertDepartmentAccess.mockImplementation(() => {
      throw new ForbiddenException();
    });
    await expect(tasks.reviewQueue(leader, queueQ({ departmentId: 'marketing' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin global review queue', async () => {
    await tasks.reviewQueue(admin, queueQ());
    expect(prisma.taskAssignment.findMany).toHaveBeenCalled();
  });

  it('timeline returns status events', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ createdByUserId: employee.userId }));
    prisma.taskStatusHistory.findMany.mockResolvedValue([{ id: 'h1', taskId: 'task-1', action: TaskHistoryAction.STARTED, actor: safeUser(), createdAt: new Date(), fromStatus: 'ACCEPTED', toStatus: 'IN_PROGRESS' }]);
    prisma.taskStatusHistory.count.mockResolvedValue(1);
    await expect(tasks.timeline('task-1', employee, { page: 1, limit: 50 })).resolves.toMatchObject({ items: [{ type: 'STATUS_CHANGED' }] });
  });

  it('comment event represented in timeline', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ createdByUserId: employee.userId }));
    prisma.taskStatusHistory.findMany.mockResolvedValue([{ id: 'h1', taskId: 'task-1', action: TaskHistoryAction.COMMENTED, actor: safeUser(), createdAt: new Date() }]);
    prisma.taskStatusHistory.count.mockResolvedValue(1);
    await expect(tasks.timeline('task-1', employee, { page: 1, limit: 50 })).resolves.toMatchObject({ items: [{ type: 'COMMENT_ADDED' }] });
  });

  it('unauthorized timeline denied', async () => {
    prisma.task.findUnique.mockResolvedValue(task({ createdByUserId: 'other', assignments: [] }));
    await expect(tasks.timeline('task-1', employee, { page: 1, limit: 50 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('pending extension queue own department', async () => {
    prisma.taskExtensionRequest.findMany.mockResolvedValue([extension()]);
    prisma.taskExtensionRequest.count.mockResolvedValue(1);
    await expect(tasks.pendingExtensions(leader, extQ())).resolves.toMatchObject({ items: [{ id: 'ext-1' }] });
  });

  it('pending extension queue cross department denied', async () => {
    scope.assertDepartmentAccess.mockImplementation(() => {
      throw new ForbiddenException();
    });
    await expect(tasks.pendingExtensions(leader, extQ({ departmentId: 'marketing' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin global pending extension queue', async () => {
    await tasks.pendingExtensions(admin, extQ());
    expect(prisma.taskExtensionRequest.findMany).toHaveBeenCalled();
  });
});

describe('Task group, cross department, selector contract closure', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let scope: ReturnType<typeof scopeMock>;

  beforeEach(() => {
    prisma = prismaMock();
    scope = scopeMock();
  });

  it('group detail', async () => {
    prisma.taskGroup.findUnique.mockResolvedValue(group('media'));
    const service = new TaskGroupsService(prisma as never, scope as never);
    await expect(service.findOne('group-1', admin)).resolves.toMatchObject({ id: 'group-1' });
  });

  it('leader own department group allowed', async () => {
    prisma.taskGroup.findUnique.mockResolvedValue(group('media'));
    const service = new TaskGroupsService(prisma as never, scope as never);
    await service.findOne('group-1', leader);
    expect(scope.assertDepartmentAccess).toHaveBeenCalledWith(leader, 'media');
  });

  it('cross department group denied', async () => {
    prisma.taskGroup.findUnique.mockResolvedValue(group('marketing'));
    scope.assertDepartmentAccess.mockImplementation(() => {
      throw new ForbiddenException();
    });
    const service = new TaskGroupsService(prisma as never, scope as never);
    await expect(service.findOne('group-1', leader)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requester cross department detail access', async () => {
    prisma.crossDepartmentRequest.findUnique.mockResolvedValue(cross({ createdByUserId: employee.userId }));
    const service = new CrossDepartmentService(prisma as never, scope as never, {} as never);
    await expect(service.findOne('cross-1', employee)).resolves.toMatchObject({ id: 'cross-1' });
  });

  it('source leader cross department access', async () => {
    prisma.crossDepartmentRequest.findUnique.mockResolvedValue(cross({ sourceDepartmentId: 'media' }));
    const service = new CrossDepartmentService(prisma as never, scope as never, {} as never);
    await expect(service.findOne('cross-1', leader)).resolves.toMatchObject({ id: 'cross-1' });
  });

  it('target leader cross department access', async () => {
    prisma.crossDepartmentRequest.findUnique.mockResolvedValue(cross({ targetDepartmentId: 'media' }));
    const service = new CrossDepartmentService(prisma as never, scope as never, {} as never);
    await expect(service.findOne('cross-1', leader)).resolves.toMatchObject({ id: 'cross-1' });
  });

  it('unrelated employee cross department denied', async () => {
    prisma.crossDepartmentRequest.findUnique.mockResolvedValue(cross({ createdByUserId: 'other' }));
    const service = new CrossDepartmentService(prisma as never, scope as never, {} as never);
    await expect(service.findOne('cross-1', employee)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leader sees own department employees', async () => {
    prisma.user.findMany.mockResolvedValue([scopedUser()]);
    prisma.user.count.mockResolvedValue(1);
    const service = new EmployeesService(prisma as never, scope as never);
    await expect(service.scoped(leader, employeeQ())).resolves.toMatchObject({ items: [{ id: 'employee' }] });
  });

  it('leader cannot request other department employees', async () => {
    scope.assertDepartmentAccess.mockImplementation(() => {
      throw new ForbiddenException();
    });
    const service = new EmployeesService(prisma as never, scope as never);
    await expect(service.scoped(leader, employeeQ({ departmentId: 'marketing' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin global selector', async () => {
    const service = new EmployeesService(prisma as never, scope as never);
    await service.scoped(admin, employeeQ());
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('sensitive fields absent from selector response', async () => {
    prisma.user.findMany.mockResolvedValue([scopedUser()]);
    prisma.user.count.mockResolvedValue(1);
    const service = new EmployeesService(prisma as never, scope as never);
    const result = await service.scoped(admin, employeeQ());
    expect(result.items[0]).not.toHaveProperty('phone');
    expect(result.items[0]).not.toHaveProperty('idCardNumber');
  });
});

function actor(userId: string, roles: string[], permissions: string[], departmentIds: string[] = []) {
  return {
    sub: userId,
    userId,
    roles,
    permissions,
    scopes: departmentIds.map((scopeId) => ({ role: 'LEADER', scopeType: RoleScopeType.DEPARTMENT, scopeId })),
  };
}

function q(overrides = {}) {
  return { page: 1, limit: 20, ...overrides };
}

function queueQ(overrides = {}) {
  return { page: 1, limit: 20, ...overrides };
}

function extQ(overrides = {}) {
  return { page: 1, limit: 20, ...overrides };
}

function employeeQ(overrides = {}) {
  return { page: 1, limit: 20, ...overrides };
}

function safeUser() {
  return { id: 'employee', userCode: 'E001', profile: { fullName: 'Employee', avatarUrl: null, employmentStatus: 'ACTIVE', position: { id: 'pos', name: 'Staff' } } };
}

function task(overrides = {}) {
  return {
    id: 'task-1',
    taskCode: 'TASK-1',
    title: 'Task',
    type: 'INDIVIDUAL',
    priority: TaskPriority.NORMAL,
    status: TaskStatus.NEW,
    departmentContextId: null,
    createdByUserId: employee.userId,
    createdBy: safeUser(),
    targets: [],
    assignments: [{ userId: employee.userId }],
    comments: [],
    attachments: [],
    extensionRequests: [],
    histories: [],
    deletedAt: null,
    ...overrides,
  };
}

function assignment() {
  return {
    id: 'assignment-1',
    taskId: 'task-1',
    assignmentDueAt: null,
    submittedAt: new Date(),
    progressPercent: 100,
    completionNote: 'done',
    user: safeUser(),
    task: { id: 'task-1', taskCode: 'TASK-1', title: 'Task', priority: TaskPriority.NORMAL, dueAt: null, departmentContextId: 'media' },
  };
}

function extension() {
  return {
    id: 'ext-1',
    taskId: 'task-1',
    assignmentId: 'assignment-1',
    requestedDueAt: new Date(),
    currentDueAt: null,
    reason: 'Need time',
    createdAt: new Date(),
    assignment: { assignmentDueAt: null, user: safeUser(), task: { id: 'task-1', title: 'Task', dueAt: null } },
  };
}

function group(departmentId: string) {
  return { id: 'group-1', departmentId, deletedAt: null, members: [] };
}

function cross(overrides = {}) {
  return {
    id: 'cross-1',
    createdByUserId: 'requester',
    sourceDepartmentId: 'source',
    targetDepartmentId: 'target',
    createdAt: new Date(),
    decidedAt: null,
    rejectionReason: null,
    status: 'PENDING_SOURCE_APPROVAL',
    createdBy: safeUser(),
    decidedBy: null,
    sourceDepartment: { id: 'source', name: 'Source' },
    targetDepartment: { id: 'target', name: 'Target' },
    task: null,
    ...overrides,
  };
}

function scopedUser() {
  return {
    id: 'employee',
    userCode: 'E001',
    isActive: true,
    profile: { fullName: 'Employee', avatarUrl: null, employmentStatus: 'ACTIVE' },
    departmentLinks: [{ department: { id: 'media', name: 'Media' }, position: { id: 'pos', name: 'Staff' } }],
  };
}

function prismaMock() {
  return {
    $transaction: jest.fn((operations: Array<Promise<unknown>>) => Promise.all(operations)),
    task: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn(), update: jest.fn() },
    taskAssignment: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn(), update: jest.fn() },
    taskStatusHistory: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    taskExtensionRequest: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    department: { findMany: jest.fn().mockResolvedValue([]) },
    taskGroup: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn() },
    crossDepartmentRequest: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  };
}

function scopeMock() {
  return {
    visibleDepartmentIds: jest.fn((currentActor) => (currentActor.roles.includes('ADMIN') ? null : ['media'])),
    assertDepartmentAccess: jest.fn(),
    getPrimaryDepartmentId: jest.fn().mockResolvedValue('media'),
    assertUserInDepartment: jest.fn(),
  };
}
