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
exports.ViolationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const violation_dto_1 = require("./dto/violation.dto");
const violations_service_1 = require("./violations.service");
let ViolationsController = class ViolationsController {
    violations;
    constructor(violations) {
        this.violations = violations;
    }
    create(dto, actor) {
        return this.violations.create(dto, actor);
    }
    findAll() {
        return this.violations.findAll();
    }
    findOne(id) {
        return this.violations.findOne(id);
    }
    confirm(id, actor) {
        return this.violations.confirm(id, actor);
    }
    reject(id) {
        return this.violations.reject(id);
    }
    createAction(id, dto) {
        return this.violations.createAction(id, dto);
    }
    approveAction(id, actor) {
        return this.violations.approveAction(id, actor);
    }
};
exports.ViolationsController = ViolationsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('violation.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [violation_dto_1.CreateViolationDto, Object]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('violation.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('violation.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.Permissions)('violation.confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('violation.confirm'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/disciplinary-actions'),
    (0, permissions_decorator_1.Permissions)('disciplinary_action.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, violation_dto_1.CreateDisciplinaryActionDto]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "createAction", null);
__decorate([
    (0, common_1.Post)('disciplinary-actions/:id/approve'),
    (0, permissions_decorator_1.Permissions)('disciplinary_action.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ViolationsController.prototype, "approveAction", null);
exports.ViolationsController = ViolationsController = __decorate([
    (0, swagger_1.ApiTags)('Violations', 'Disciplinary Actions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('violations'),
    __metadata("design:paramtypes", [violations_service_1.ViolationsService])
], ViolationsController);
//# sourceMappingURL=violations.controller.js.map