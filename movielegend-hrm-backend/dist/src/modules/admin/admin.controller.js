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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const admin_service_1 = require("./admin.service");
const leader_assignment_dto_1 = require("./dto/leader-assignment.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const user_query_dto_1 = require("./dto/user-query.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    assignLeader(dto, actor) {
        return this.adminService.assignLeader(dto, actor);
    }
    revokeLeader(id, actor) {
        return this.adminService.revokeLeader(id, actor);
    }
    findUsers(query) {
        return this.adminService.findUsers(query);
    }
    findUser(id) {
        return this.adminService.findUser(id);
    }
    updateUser(id, dto) {
        return this.adminService.updateUser(id, dto);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, permissions_decorator_1.Permissions)('role.assign'),
    (0, common_1.Post)('leader-assignments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leader_assignment_dto_1.LeaderAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignLeader", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('role.assign'),
    (0, common_1.Delete)('leader-assignments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "revokeLeader", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('user.read'),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_query_dto_1.UserQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "findUsers", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('user.read'),
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "findUser", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('user.update'),
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map