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
exports.CrossDepartmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const cross_department_service_1 = require("./cross-department.service");
const cross_department_dto_1 = require("./dto/cross-department.dto");
let CrossDepartmentController = class CrossDepartmentController {
    requests;
    constructor(requests) {
        this.requests = requests;
    }
    create(dto, actor) {
        return this.requests.create(dto, actor);
    }
    findAll(actor) {
        return this.requests.findAll(actor);
    }
    findOne(id, actor) {
        return this.requests.findOne(id, actor);
    }
    approveSource(id, actor) {
        return this.requests.approveSource(id, actor);
    }
    rejectSource(id, dto, actor) {
        return this.requests.rejectSource(id, dto, actor);
    }
    acceptTarget(id, actor) {
        return this.requests.acceptTarget(id, actor);
    }
    rejectTarget(id, dto, actor) {
        return this.requests.rejectTarget(id, dto, actor);
    }
};
exports.CrossDepartmentController = CrossDepartmentController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('cross_department.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cross_department_dto_1.CreateCrossDepartmentRequestDto, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('cross_department.create', 'cross_department.source_approve', 'cross_department.target_receive', 'cross_department.read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('cross_department.create', 'cross_department.source_approve', 'cross_department.target_receive', 'cross_department.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/source-approve'),
    (0, permissions_decorator_1.Permissions)('cross_department.source_approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "approveSource", null);
__decorate([
    (0, common_1.Patch)(':id/source-reject'),
    (0, permissions_decorator_1.Permissions)('cross_department.source_approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cross_department_dto_1.RejectCrossDepartmentRequestDto, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "rejectSource", null);
__decorate([
    (0, common_1.Patch)(':id/target-accept'),
    (0, permissions_decorator_1.Permissions)('cross_department.target_receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "acceptTarget", null);
__decorate([
    (0, common_1.Patch)(':id/target-reject'),
    (0, permissions_decorator_1.Permissions)('cross_department.target_receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cross_department_dto_1.RejectCrossDepartmentRequestDto, Object]),
    __metadata("design:returntype", void 0)
], CrossDepartmentController.prototype, "rejectTarget", null);
exports.CrossDepartmentController = CrossDepartmentController = __decorate([
    (0, swagger_1.ApiTags)('Cross Department'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('cross-department-requests'),
    __metadata("design:paramtypes", [cross_department_service_1.CrossDepartmentService])
], CrossDepartmentController);
//# sourceMappingURL=cross-department.controller.js.map