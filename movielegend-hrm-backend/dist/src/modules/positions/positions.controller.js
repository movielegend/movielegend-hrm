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
exports.PositionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const position_dto_1 = require("./dto/position.dto");
const positions_service_1 = require("./positions.service");
let PositionsController = class PositionsController {
    positionsService;
    constructor(positionsService) {
        this.positionsService = positionsService;
    }
    findAll(user, query) {
        return this.positionsService.findAll(user, query);
    }
    findOne(user, id) {
        return this.positionsService.findOne(user, id);
    }
    create(user, dto) {
        return this.positionsService.create(user, dto);
    }
    update(user, id, dto) {
        return this.positionsService.update(user, id, dto);
    }
    remove(user, id) {
        return this.positionsService.remove(user, id);
    }
};
exports.PositionsController = PositionsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('position.read'),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, position_dto_1.PositionQueryDto]),
    __metadata("design:returntype", void 0)
], PositionsController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('position.read'),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PositionsController.prototype, "findOne", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('position.create'),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, position_dto_1.CreatePositionDto]),
    __metadata("design:returntype", void 0)
], PositionsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('position.update'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, position_dto_1.UpdatePositionDto]),
    __metadata("design:returntype", void 0)
], PositionsController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('position.delete'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PositionsController.prototype, "remove", null);
exports.PositionsController = PositionsController = __decorate([
    (0, swagger_1.ApiTags)('Positions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('positions'),
    __metadata("design:paramtypes", [positions_service_1.PositionsService])
], PositionsController);
//# sourceMappingURL=positions.controller.js.map