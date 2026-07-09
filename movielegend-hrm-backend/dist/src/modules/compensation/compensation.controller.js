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
exports.DeductionsController = exports.BonusesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const compensation_service_1 = require("./compensation.service");
const compensation_dto_1 = require("./dto/compensation.dto");
let BonusesController = class BonusesController {
    compensation;
    constructor(compensation) {
        this.compensation = compensation;
    }
    create(dto, actor) {
        return this.compensation.createBonus(dto, actor);
    }
    findAll() {
        return this.compensation.findBonuses();
    }
    approve(id, actor) {
        return this.compensation.approveBonus(id, actor);
    }
    reject(id, dto) {
        return this.compensation.rejectBonus(id, dto);
    }
    cancel(id) {
        return this.compensation.cancelBonus(id);
    }
};
exports.BonusesController = BonusesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('bonus.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compensation_dto_1.CreateBonusDto, Object]),
    __metadata("design:returntype", void 0)
], BonusesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('bonus.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BonusesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('bonus.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BonusesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('bonus.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, compensation_dto_1.RejectCompensationDto]),
    __metadata("design:returntype", void 0)
], BonusesController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('bonus.create'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BonusesController.prototype, "cancel", null);
exports.BonusesController = BonusesController = __decorate([
    (0, swagger_1.ApiTags)('Bonuses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('bonuses'),
    __metadata("design:paramtypes", [compensation_service_1.CompensationService])
], BonusesController);
let DeductionsController = class DeductionsController {
    compensation;
    constructor(compensation) {
        this.compensation = compensation;
    }
    create(dto, actor) {
        return this.compensation.createDeduction(dto, actor);
    }
    findAll() {
        return this.compensation.findDeductions();
    }
    approve(id, actor) {
        return this.compensation.approveDeduction(id, actor);
    }
    reject(id, dto) {
        return this.compensation.rejectDeduction(id, dto);
    }
    cancel(id) {
        return this.compensation.cancelDeduction(id);
    }
};
exports.DeductionsController = DeductionsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('deduction.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compensation_dto_1.CreateDeductionDto, Object]),
    __metadata("design:returntype", void 0)
], DeductionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('deduction.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeductionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('deduction.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DeductionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('deduction.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, compensation_dto_1.RejectCompensationDto]),
    __metadata("design:returntype", void 0)
], DeductionsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('deduction.create'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DeductionsController.prototype, "cancel", null);
exports.DeductionsController = DeductionsController = __decorate([
    (0, swagger_1.ApiTags)('Deductions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('deductions'),
    __metadata("design:paramtypes", [compensation_service_1.CompensationService])
], DeductionsController);
//# sourceMappingURL=compensation.controller.js.map