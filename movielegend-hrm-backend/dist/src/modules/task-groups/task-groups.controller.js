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
exports.TaskGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const task_group_dto_1 = require("./dto/task-group.dto");
const task_groups_service_1 = require("./task-groups.service");
let TaskGroupsController = class TaskGroupsController {
    groups;
    constructor(groups) {
        this.groups = groups;
    }
    create(dto, actor) {
        return this.groups.create(dto, actor);
    }
    findAll(actor, query) {
        return this.groups.findAll(actor, query);
    }
    findOne(id, actor) {
        return this.groups.findOne(id, actor);
    }
    addMember(id, dto, actor) {
        return this.groups.addMember(id, dto, actor);
    }
    removeMember(id, userId, actor) {
        return this.groups.removeMember(id, userId, actor);
    }
};
exports.TaskGroupsController = TaskGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, any_permissions_decorator_1.AnyPermissions)('task.group.manage_all', 'task.group.manage_department'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_group_dto_1.CreateTaskGroupDto, Object]),
    __metadata("design:returntype", void 0)
], TaskGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('task.group.manage_all', 'task.group.manage_department', 'task.read_department'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_group_dto_1.TaskGroupQueryDto]),
    __metadata("design:returntype", void 0)
], TaskGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.group.manage_all', 'task.group.manage_department', 'task.read_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TaskGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.group.manage_all', 'task.group.manage_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_group_dto_1.AddTaskGroupMemberDto, Object]),
    __metadata("design:returntype", void 0)
], TaskGroupsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, any_permissions_decorator_1.AnyPermissions)('task.group.manage_all', 'task.group.manage_department'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TaskGroupsController.prototype, "removeMember", null);
exports.TaskGroupsController = TaskGroupsController = __decorate([
    (0, swagger_1.ApiTags)('Task Groups'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('task-groups'),
    __metadata("design:paramtypes", [task_groups_service_1.TaskGroupsService])
], TaskGroupsController);
//# sourceMappingURL=task-groups.controller.js.map