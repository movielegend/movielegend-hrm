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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const leave_dto_1 = require("./dto/leave.dto");
const leave_service_1 = require("./leave.service");
let LeaveController = class LeaveController {
    leaveService;
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    createLeaveType(dto) {
        return this.leaveService.createLeaveType(dto);
    }
    findLeaveTypes() {
        return this.leaveService.findActiveLeaveTypes();
    }
    createLeaveRequest(dto, actor) {
        return this.leaveService.createLeaveRequest(dto, actor);
    }
    findLeaveRequests(actor, query) {
        return this.leaveService.findLeaveRequests(actor, query);
    }
    findMyLeaveRequests(actor, query) {
        return this.leaveService.findMyLeaveRequests(actor, query);
    }
    approveLeave(id, actor) {
        return this.leaveService.approveLeave(id, actor);
    }
    rejectLeave(id, dto, actor) {
        return this.leaveService.rejectLeave(id, dto, actor);
    }
    createOvertime(dto, actor) {
        return this.leaveService.createOvertimeRequest(dto, actor);
    }
    approveOvertime(id, actor) {
        return this.leaveService.approveOvertime(id, actor);
    }
    myOvertime(actor, query) {
        return this.leaveService.findMyOvertimeRequests(actor, query);
    }
    pendingOvertime(actor, query) {
        return this.leaveService.findPendingOvertimeRequests(actor, query);
    }
    rejectOvertime(id, dto, actor) {
        return this.leaveService.rejectOvertime(id, dto, actor);
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, permissions_decorator_1.Permissions)('leave.type.manage'),
    (0, common_1.Post)('leave-types'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.CreateLeaveTypeDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "createLeaveType", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('leave.request', 'leave.balance.read', 'leave.approve'),
    (0, common_1.Get)('leave/types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findLeaveTypes", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('leave.request'),
    (0, common_1.Post)('leave-requests'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.CreateLeaveRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "createLeaveRequest", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('leave.balance.read', 'leave.approve'),
    (0, common_1.Get)('leave-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, leave_dto_1.LeaveRequestQueryDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findLeaveRequests", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('leave.request', 'leave.balance.read'),
    (0, common_1.Get)('leave-requests/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, leave_dto_1.LeaveRequestQueryDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findMyLeaveRequests", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('leave.approve'),
    (0, common_1.Post)('leave-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approveLeave", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('leave.approve'),
    (0, common_1.Post)('leave-requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_dto_1.RejectRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "rejectLeave", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('overtime.request'),
    (0, common_1.Post)('overtime-requests'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_dto_1.CreateOvertimeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "createOvertime", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('overtime.approve'),
    (0, common_1.Post)('overtime-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approveOvertime", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('overtime.request', 'overtime.approve'),
    (0, common_1.Get)('overtime/requests/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, leave_dto_1.OvertimeRequestQueryDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "myOvertime", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('overtime.approve'),
    (0, common_1.Get)('overtime/requests/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, leave_dto_1.OvertimeRequestQueryDto]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "pendingOvertime", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('overtime.approve'),
    (0, common_1.Post)('overtime/requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_dto_1.RejectRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "rejectOvertime", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('Leave'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map