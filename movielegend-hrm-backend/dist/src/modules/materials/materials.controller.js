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
exports.MaterialsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const material_dto_1 = require("./dto/material.dto");
const materials_service_1 = require("./materials.service");
let MaterialsController = class MaterialsController {
    materials;
    constructor(materials) {
        this.materials = materials;
    }
    createCategory(dto) {
        return this.materials.createCategory(dto);
    }
    findCategories() {
        return this.materials.findCategories();
    }
    create(dto) {
        return this.materials.create(dto);
    }
    findAll() {
        return this.materials.findAll();
    }
    findOne(id) {
        return this.materials.findOne(id);
    }
    update(id, dto) {
        return this.materials.update(id, dto);
    }
};
exports.MaterialsController = MaterialsController;
__decorate([
    (0, common_1.Post)('material-categories'),
    (0, permissions_decorator_1.Permissions)('material.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [material_dto_1.CreateMaterialCategoryDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('material-categories'),
    (0, permissions_decorator_1.Permissions)('material.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findCategories", null);
__decorate([
    (0, common_1.Post)('materials'),
    (0, permissions_decorator_1.Permissions)('material.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [material_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, permissions_decorator_1.Permissions)('material.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('materials/:id'),
    (0, permissions_decorator_1.Permissions)('material.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('materials/:id'),
    (0, permissions_decorator_1.Permissions)('material.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, material_dto_1.UpdateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "update", null);
exports.MaterialsController = MaterialsController = __decorate([
    (0, swagger_1.ApiTags)('Materials'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [materials_service_1.MaterialsService])
], MaterialsController);
//# sourceMappingURL=materials.controller.js.map