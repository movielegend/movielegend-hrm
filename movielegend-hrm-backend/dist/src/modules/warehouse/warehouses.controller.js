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
exports.WarehousesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const warehouse_dto_1 = require("./dto/warehouse.dto");
const warehouses_service_1 = require("./warehouses.service");
let WarehousesController = class WarehousesController {
    warehouses;
    constructor(warehouses) {
        this.warehouses = warehouses;
    }
    create(dto, actor) {
        return this.warehouses.create(dto, actor);
    }
    findAll(actor) {
        return this.warehouses.findAll(actor);
    }
    findOne(id, actor) {
        return this.warehouses.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.warehouses.update(id, dto, actor);
    }
    close(id, actor) {
        return this.warehouses.close(id, actor);
    }
    stocks(id, actor) {
        return this.warehouses.stocks(id, actor);
    }
};
exports.WarehousesController = WarehousesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('warehouse.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateWarehouseDto, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('warehouse.read', 'warehouse.manage', 'stock.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('warehouse.read', 'warehouse.manage', 'stock.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('warehouse.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, warehouse_dto_1.UpdateWarehouseDto, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('warehouse.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "close", null);
__decorate([
    (0, common_1.Get)(':id/stocks'),
    (0, permissions_decorator_1.Permissions)('stock.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "stocks", null);
exports.WarehousesController = WarehousesController = __decorate([
    (0, swagger_1.ApiTags)('Warehouses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouses_service_1.WarehousesService])
], WarehousesController);
//# sourceMappingURL=warehouses.controller.js.map