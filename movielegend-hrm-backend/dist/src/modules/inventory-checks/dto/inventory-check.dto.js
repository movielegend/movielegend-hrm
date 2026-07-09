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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInventoryCheckItemsDto = exports.InventoryCheckItemUpdateDto = exports.CreateInventoryCheckDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateInventoryCheckDto {
    warehouseId;
    note;
}
exports.CreateInventoryCheckDto = CreateInventoryCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInventoryCheckDto.prototype, "warehouseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryCheckDto.prototype, "note", void 0);
class InventoryCheckItemUpdateDto {
    id;
    actualQuantity;
    actualAssetStatus;
    note;
}
exports.InventoryCheckItemUpdateDto = InventoryCheckItemUpdateDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventoryCheckItemUpdateDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryCheckItemUpdateDto.prototype, "actualQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AssetStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AssetStatus),
    __metadata("design:type", String)
], InventoryCheckItemUpdateDto.prototype, "actualAssetStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryCheckItemUpdateDto.prototype, "note", void 0);
class UpdateInventoryCheckItemsDto {
    items;
}
exports.UpdateInventoryCheckItemsDto = UpdateInventoryCheckItemsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryCheckItemUpdateDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InventoryCheckItemUpdateDto),
    __metadata("design:type", Array)
], UpdateInventoryCheckItemsDto.prototype, "items", void 0);
//# sourceMappingURL=inventory-check.dto.js.map