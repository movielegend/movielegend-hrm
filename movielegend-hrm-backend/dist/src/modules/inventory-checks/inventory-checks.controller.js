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
exports.InventoryChecksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const inventory_check_dto_1 = require("./dto/inventory-check.dto");
const inventory_checks_service_1 = require("./inventory-checks.service");
let InventoryChecksController = class InventoryChecksController {
    checks;
    constructor(checks) {
        this.checks = checks;
    }
    create(dto, actor) {
        return this.checks.create(dto, actor);
    }
    findAll(actor) {
        return this.checks.findAll(actor);
    }
    findOne(id, actor) {
        return this.checks.findOne(id, actor);
    }
    updateItems(id, dto, actor) {
        return this.checks.updateItems(id, dto, actor);
    }
    submit(id, actor) {
        return this.checks.submit(id, actor);
    }
    approve(id, actor) {
        return this.checks.approve(id, actor);
    }
};
exports.InventoryChecksController = InventoryChecksController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('inventory_check.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_check_dto_1.CreateInventoryCheckDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('inventory_check.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('inventory_check.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/items'),
    (0, permissions_decorator_1.Permissions)('inventory_check.submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_check_dto_1.UpdateInventoryCheckItemsDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "updateItems", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, permissions_decorator_1.Permissions)('inventory_check.submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('inventory_check.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryChecksController.prototype, "approve", null);
exports.InventoryChecksController = InventoryChecksController = __decorate([
    (0, swagger_1.ApiTags)('Inventory Checks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('inventory-checks'),
    __metadata("design:paramtypes", [inventory_checks_service_1.InventoryChecksService])
], InventoryChecksController);
//# sourceMappingURL=inventory-checks.controller.js.map