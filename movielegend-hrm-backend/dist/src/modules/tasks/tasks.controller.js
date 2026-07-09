"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExtensionsController = exports.TaskAssignmentsController = exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const task_dto_1 = require("./dto/task.dto");
const tasks_service_1 = require("./tasks.service");
let TasksController = class TasksController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    create(dto, actor) {
        return this.tasks.create(dto, actor);
    }
    findAll(actor, query) {
        return this.tasks.findAll(actor, query);
    }
    findMine(actor, query) {
        return this.tasks.findMine(actor, query);
    }
    timeline(id, actor, query) {
        return this.tasks.timeline(id, actor, query);
    }
    findOne(id, actor) {
        return this.tasks.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.tasks.update(id, dto, actor);
    }
    cancel(id, actor) {
        return this.tasks.cancel(id, actor);
    }
    comment(id, dto, actor) {
        return this.tasks.comment(id, dto, actor);
    }
    attach(id, dto, actor) {
        return this.tasks.attach(id, dto, actor);
    }
    requestExtension(id, dto, actor) {
        return this.tasks.requestExtension(id, dto, actor);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, any_permissions_decorator_1.AnyPermissions)('task.assign_any', 'task.assign_department'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('task.read_all', 'task.read_department', 'task.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.TaskQueryDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, permissions_decorator_1.Permissions)('task.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.TaskQueryDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.read_all', 'task.read_department', 'task.read_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, task_dto_1.TaskTimelineQueryDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "timeline", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.read_all', 'task.read_department', 'task.read_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.assign_any', 'task.assign_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.assign_any', 'task.assign_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.comment_own', 'task.read_department', 'task.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.CreateTaskCommentDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "comment", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.comment_own', 'task.read_department', 'task.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.CreateTaskAttachmentDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "attach", null);
__decorate([
    (0, common_1.Post)(':id/extensions'),
    (0, permissions_decorator_1.Permissions)('task.extension_request_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.CreateTaskExtensionRequestDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "requestExtension", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('Tasks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
let TaskAssignmentsController = class TaskAssignmentsController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    reviewQueue(actor, query) {
        return this.tasks.reviewQueue(actor, query);
    }
    accept(id, actor) {
        return this.tasks.acceptAssignment(id, actor);
    }
    start(id, actor) {
        return this.tasks.startAssignment(id, actor);
    }
    progress(id, dto, actor) {
        return this.tasks.updateProgress(id, dto, actor);
    }
    submit(id, dto, actor) {
        return this.tasks.submitAssignment(id, dto, actor);
    }
    approve(id, dto, actor) {
        return this.tasks.approveAssignment(id, dto, actor);
    }
    reject(id, dto, actor) {
        return this.tasks.rejectAssignment(id, dto, actor);
    }
};
exports.TaskAssignmentsController = TaskAssignmentsController;
__decorate([
    (0, common_1.Get)('review-queue'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.review_all', 'task.review_department'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.TaskReviewQueueQueryDto]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "reviewQueue", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, permissions_decorator_1.Permissions)('task.accept_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    (0, permissions_decorator_1.Permissions)('task.update_progress_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)(':id/progress'),
    (0, permissions_decorator_1.Permissions)('task.update_progress_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.UpdateProgressDto, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "progress", null);
__decorate([
    (0, common_1.Patch)(':id/submit'),
    (0, permissions_decorator_1.Permissions)('task.submit_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.SubmitTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.review_all', 'task.review_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.ReviewTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.review_all', 'task.review_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.ReviewTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TaskAssignmentsController.prototype, "reject", null);
exports.TaskAssignmentsController = TaskAssignmentsController = __decorate([
    (0, swagger_1.ApiTags)('Task Assignments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('task-assignments'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TaskAssignmentsController);
let TaskExtensionsController = class TaskExtensionsController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    pending(actor, query) {
        return this.tasks.pendingExtensions(actor, query);
    }
    approve(id, actor) {
        return this.tasks.approveExtension(id, actor);
    }
    reject(id, dto, actor) {
        return this.tasks.rejectExtension(id, actor, dto.note);
    }
};
exports.TaskExtensionsController = TaskExtensionsController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.extension_review_all', 'task.extension_review_department'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.TaskExtensionPendingQueryDto]),
    __metadata("design:returntype", void 0)
], TaskExtensionsController.prototype, "pending", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.extension_review_all', 'task.extension_review_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TaskExtensionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.extension_review_all', 'task.extension_review_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.ReviewTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TaskExtensionsController.prototype, "reject", null);
exports.TaskExtensionsController = TaskExtensionsController = __decorate([
    (0, swagger_1.ApiTags)('Task Extensions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('task-extensions'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TaskExtensionsController);
//# sourceMappingURL=tasks.controller.js.map