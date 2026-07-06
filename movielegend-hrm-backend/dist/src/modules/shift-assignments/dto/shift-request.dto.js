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
exports.ShiftSwapDto = exports.ShiftRegistrationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ShiftRegistrationDto {
    shiftId;
    workDate;
    reason;
}
exports.ShiftRegistrationDto = ShiftRegistrationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShiftRegistrationDto.prototype, "shiftId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShiftRegistrationDto.prototype, "workDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], ShiftRegistrationDto.prototype, "reason", void 0);
class ShiftSwapDto {
    targetUserId;
    fromShiftId;
    toShiftId;
    fromDate;
    toDate;
    reason;
}
exports.ShiftSwapDto = ShiftSwapDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "targetUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "fromShiftId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "toShiftId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "toDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], ShiftSwapDto.prototype, "reason", void 0);
//# sourceMappingURL=shift-request.dto.js.map