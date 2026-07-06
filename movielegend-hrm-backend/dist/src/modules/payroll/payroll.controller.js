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
exports.PayrollsController = exports.PayrollPeriodsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const payroll_dto_1 = require("./dto/payroll.dto");
const payroll_service_1 = require("./payroll.service");
let PayrollPeriodsController = class PayrollPeriodsController {
    payroll;
    constructor(payroll) {
        this.payroll = payroll;
    }
    create(dto, actor) {
        return this.payroll.createPeriod(dto, actor);
    }
    findAll() {
        return this.payroll.findPeriods();
    }
    findOne(id) {
        return this.payroll.findPeriod(id);
    }
    calculate(id, actor) {
        return this.payroll.calculatePeriod(id, actor);
    }
    recalculate(id, actor) {
        return this.payroll.recalculatePeriod(id, actor);
    }
    submitReview(id, actor) {
        return this.payroll.submitReview(id, actor);
    }
    approve(id, actor) {
        return this.payroll.approve(id, actor);
    }
    lock(id, actor) {
        return this.payroll.lock(id, actor);
    }
    payrolls(id) {
        return this.payroll.findPeriodPayrolls(id);
    }
};
exports.PayrollPeriodsController = PayrollPeriodsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('payroll_period.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_dto_1.CreatePayrollPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('payroll_period.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('payroll_period.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/calculate'),
    (0, permissions_decorator_1.Permissions)('payroll.calculate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)(':id/recalculate'),
    (0, permissions_decorator_1.Permissions)('payroll.calculate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "recalculate", null);
__decorate([
    (0, common_1.Post)(':id/submit-review'),
    (0, permissions_decorator_1.Permissions)('payroll.review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('payroll.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/lock'),
    (0, permissions_decorator_1.Permissions)('payroll.lock'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "lock", null);
__decorate([
    (0, common_1.Get)(':id/payrolls'),
    (0, permissions_decorator_1.Permissions)('payroll.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollPeriodsController.prototype, "payrolls", null);
exports.PayrollPeriodsController = PayrollPeriodsController = __decorate([
    (0, swagger_1.ApiTags)('Payroll Periods'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payroll-periods'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollPeriodsController);
let PayrollsController = class PayrollsController {
    payroll;
    constructor(payroll) {
        this.payroll = payroll;
    }
    myPayrolls(actor) {
        return this.payroll.myPayrolls(actor);
    }
    myPayroll(id, actor) {
        return this.payroll.myPayroll(id, actor);
    }
    findOne(id) {
        return this.payroll.findPayroll(id);
    }
};
exports.PayrollsController = PayrollsController;
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('payroll.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollsController.prototype, "myPayrolls", null);
__decorate([
    (0, common_1.Get)('my/:id'),
    (0, permissions_decorator_1.Permissions)('payroll.read_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollsController.prototype, "myPayroll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('payroll.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollsController.prototype, "findOne", null);
exports.PayrollsController = PayrollsController = __decorate([
    (0, swagger_1.ApiTags)('Payrolls'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payrolls'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollsController);
//# sourceMappingURL=payroll.controller.js.map