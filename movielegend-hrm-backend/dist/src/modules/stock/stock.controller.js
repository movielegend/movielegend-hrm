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
exports.StockTransfersController = exports.MaterialIssuesController = exports.StockReceiptsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const stock_dto_1 = require("./dto/stock.dto");
const stock_service_1 = require("./stock.service");
let StockReceiptsController = class StockReceiptsController {
    stock;
    constructor(stock) {
        this.stock = stock;
    }
    create(dto, actor) {
        return this.stock.createReceipt(dto, actor);
    }
    findAll(actor) {
        return this.stock.findReceipts(actor);
    }
    findOne(id, actor) {
        return this.stock.findReceipt(id, actor);
    }
    approve(id, actor) {
        return this.stock.approveReceipt(id, actor);
    }
    cancel(id, actor) {
        return this.stock.cancelReceipt(id, actor);
    }
};
exports.StockReceiptsController = StockReceiptsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('stock.import'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.CreateStockReceiptDto, Object]),
    __metadata("design:returntype", void 0)
], StockReceiptsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('stock.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StockReceiptsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('stock.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockReceiptsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('stock.import'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockReceiptsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('stock.import'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockReceiptsController.prototype, "cancel", null);
exports.StockReceiptsController = StockReceiptsController = __decorate([
    (0, swagger_1.ApiTags)('Stock Receipts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('stock-receipts'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockReceiptsController);
let MaterialIssuesController = class MaterialIssuesController {
    stock;
    constructor(stock) {
        this.stock = stock;
    }
    create(dto, actor) {
        return this.stock.createIssue(dto, actor);
    }
    findAll(actor) {
        return this.stock.findIssues(actor);
    }
    findOne(id, actor) {
        return this.stock.findIssue(id, actor);
    }
    approve(id, actor) {
        return this.stock.approveIssue(id, actor);
    }
    reject(id, dto, actor) {
        return this.stock.rejectIssue(id, dto, actor);
    }
    issue(id, actor) {
        return this.stock.issueMaterials(id, actor);
    }
    cancel(id, actor) {
        return this.stock.cancelIssue(id, actor);
    }
};
exports.MaterialIssuesController = MaterialIssuesController;
__decorate([
    (0, common_1.Post)(),
    (0, any_permissions_decorator_1.AnyPermissions)('material_issue.create', 'stock.export'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.CreateMaterialIssueDto, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('material_issue.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('material_issue.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('material_issue.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('material_issue.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, stock_dto_1.RejectDto, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/issue'),
    (0, permissions_decorator_1.Permissions)('material_issue.issue'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "issue", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, any_permissions_decorator_1.AnyPermissions)('material_issue.create', 'material_issue.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MaterialIssuesController.prototype, "cancel", null);
exports.MaterialIssuesController = MaterialIssuesController = __decorate([
    (0, swagger_1.ApiTags)('Material Issues'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('material-issues'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], MaterialIssuesController);
let StockTransfersController = class StockTransfersController {
    stock;
    constructor(stock) {
        this.stock = stock;
    }
    create(dto, actor) {
        return this.stock.createTransfer(dto, actor);
    }
    findAll(actor) {
        return this.stock.findTransfers(actor);
    }
    approve(id, actor) {
        return this.stock.approveTransfer(id, actor);
    }
    ship(id, actor) {
        return this.stock.shipTransfer(id, actor);
    }
    receive(id, actor) {
        return this.stock.receiveTransfer(id, actor);
    }
    cancel(id, actor) {
        return this.stock.cancelTransfer(id, actor);
    }
};
exports.StockTransfersController = StockTransfersController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('stock.transfer'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_dto_1.CreateStockTransferDto, Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('stock.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('stock.transfer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    (0, permissions_decorator_1.Permissions)('stock.transfer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "ship", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, permissions_decorator_1.Permissions)('stock.transfer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "receive", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_decorator_1.Permissions)('stock.transfer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockTransfersController.prototype, "cancel", null);
exports.StockTransfersController = StockTransfersController = __decorate([
    (0, swagger_1.ApiTags)('Stock Transfers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('stock-transfers'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockTransfersController);
//# sourceMappingURL=stock.controller.js.map