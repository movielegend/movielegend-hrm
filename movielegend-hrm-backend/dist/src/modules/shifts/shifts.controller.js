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
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const create_shift_dto_1 = require("./dto/create-shift.dto");
const shifts_service_1 = require("./shifts.service");
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    create(dto) {
        return this.shiftsService.create(dto);
    }
    findAll() {
        return this.shiftsService.findAll();
    }
    update(id, dto) {
        return this.shiftsService.update(id, dto);
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.create'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_shift_dto_1.CreateShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.read'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.update'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_shift_dto_1.UpdateShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "update", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, swagger_1.ApiTags)('Shifts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('shifts'),
    __metadata("design:paramtypes", [shifts_service_1.ShiftsService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map