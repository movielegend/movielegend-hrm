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
exports.AssetMaintenanceController = exports.AssetIncidentsController = exports.AssetAssignmentsController = exports.AssetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const assets_service_1 = require("./assets.service");
const asset_dto_1 = require("./dto/asset.dto");
let AssetsController = class AssetsController {
    assets;
    constructor(assets) {
        this.assets = assets;
    }
    create(dto, actor) {
        return this.assets.create(dto, actor);
    }
    findAll(actor) {
        return this.assets.findAll(actor);
    }
    myAssets(actor) {
        return this.assets.myAssets(actor);
    }
    findOne(id, actor) {
        return this.assets.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.assets.update(id, dto, actor);
    }
    transfer(id, dto, actor) {
        return this.assets.transfer(id, dto, actor);
    }
    assign(id, dto, actor) {
        return this.assets.assign(id, dto, actor);
    }
    revoke(id, dto, actor) {
        return this.assets.revoke(id, dto, actor);
    }
    reportIncident(id, dto, actor) {
        return this.assets.reportIncident(id, dto, actor);
    }
    startMaintenance(id, dto, actor) {
        return this.assets.startMaintenance(id, dto, actor);
    }
};
exports.AssetsController = AssetsController;
__decorate([
    (0, common_1.Post)('assets'),
    (0, permissions_decorator_1.Permissions)('asset.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asset_dto_1.CreateAssetDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('assets'),
    (0, permissions_decorator_1.Permissions)('asset.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('assets/my'),
    (0, permissions_decorator_1.Permissions)('asset.read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "myAssets", null);
__decorate([
    (0, common_1.Get)('assets/:id'),
    (0, permissions_decorator_1.Permissions)('asset.read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('assets/:id'),
    (0, permissions_decorator_1.Permissions)('asset.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.UpdateAssetDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('assets/:id/transfer'),
    (0, permissions_decorator_1.Permissions)('asset.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.TransferAssetDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('assets/:id/assign'),
    (0, permissions_decorator_1.Permissions)('asset.assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.AssignAssetDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('assets/:id/revoke'),
    (0, permissions_decorator_1.Permissions)('asset.assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.RevokeAssetDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)('assets/:id/incidents'),
    (0, permissions_decorator_1.Permissions)('asset.incident.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.ReportIncidentDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "reportIncident", null);
__decorate([
    (0, common_1.Post)('assets/:id/maintenance'),
    (0, permissions_decorator_1.Permissions)('asset.maintenance.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.MaintenanceDto, Object]),
    __metadata("design:returntype", void 0)
], AssetsController.prototype, "startMaintenance", null);
exports.AssetsController = AssetsController = __decorate([
    (0, swagger_1.ApiTags)('Assets'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsController);
let AssetAssignmentsController = class AssetAssignmentsController {
    assets;
    constructor(assets) {
        this.assets = assets;
    }
    confirm(id, actor) {
        return this.assets.confirmAssignment(id, actor);
    }
    requestReturn(id, actor) {
        return this.assets.requestReturn(id, actor);
    }
    receiveReturn(id, dto, actor) {
        return this.assets.receiveReturn(id, dto, actor);
    }
};
exports.AssetAssignmentsController = AssetAssignmentsController;
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, permissions_decorator_1.Permissions)('asset.return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AssetAssignmentsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/request-return'),
    (0, permissions_decorator_1.Permissions)('asset.return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AssetAssignmentsController.prototype, "requestReturn", null);
__decorate([
    (0, common_1.Post)(':id/receive-return'),
    (0, permissions_decorator_1.Permissions)('asset.return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.ReceiveReturnDto, Object]),
    __metadata("design:returntype", void 0)
], AssetAssignmentsController.prototype, "receiveReturn", null);
exports.AssetAssignmentsController = AssetAssignmentsController = __decorate([
    (0, swagger_1.ApiTags)('Asset Assignments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('asset-assignments'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetAssignmentsController);
let AssetIncidentsController = class AssetIncidentsController {
    assets;
    constructor(assets) {
        this.assets = assets;
    }
    findAll() {
        return this.assets.findIncidents();
    }
    findOne(id) {
        return this.assets.findIncident(id);
    }
    investigate(id) {
        return this.assets.investigateIncident(id);
    }
    resolve(id, dto, actor) {
        return this.assets.resolveIncident(id, dto, actor);
    }
    reject(id, dto, actor) {
        return this.assets.rejectIncident(id, dto, actor);
    }
};
exports.AssetIncidentsController = AssetIncidentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('asset.incident.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AssetIncidentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('asset.incident.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssetIncidentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/investigate'),
    (0, permissions_decorator_1.Permissions)('asset.incident.resolve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssetIncidentsController.prototype, "investigate", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    (0, permissions_decorator_1.Permissions)('asset.incident.resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.ResolveIncidentDto, Object]),
    __metadata("design:returntype", void 0)
], AssetIncidentsController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('asset.incident.resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.ResolveIncidentDto, Object]),
    __metadata("design:returntype", void 0)
], AssetIncidentsController.prototype, "reject", null);
exports.AssetIncidentsController = AssetIncidentsController = __decorate([
    (0, swagger_1.ApiTags)('Asset Incidents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('asset-incidents'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetIncidentsController);
let AssetMaintenanceController = class AssetMaintenanceController {
    assets;
    constructor(assets) {
        this.assets = assets;
    }
    complete(id, dto, actor) {
        return this.assets.completeMaintenance(id, dto.conditionWhenReturned, actor);
    }
};
exports.AssetMaintenanceController = AssetMaintenanceController;
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, permissions_decorator_1.Permissions)('asset.maintenance.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, asset_dto_1.ReceiveReturnDto, Object]),
    __metadata("design:returntype", void 0)
], AssetMaintenanceController.prototype, "complete", null);
exports.AssetMaintenanceController = AssetMaintenanceController = __decorate([
    (0, swagger_1.ApiTags)('Asset Maintenance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('asset-maintenance'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetMaintenanceController);
//# sourceMappingURL=assets.controller.js.map