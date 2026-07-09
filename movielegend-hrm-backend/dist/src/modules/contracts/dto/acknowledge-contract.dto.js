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
exports.AcknowledgeContractDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AcknowledgeContractDto {
    isAgreed;
    note;
}
exports.AcknowledgeContractDto = AcknowledgeContractDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True nếu nhân viên đồng ý, False nếu không đồng ý' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], AcknowledgeContractDto.prototype, "isAgreed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Lý do hoặc ghi chú (bắt buộc nếu không đồng ý)' }),
    (0, class_validator_1.ValidateIf)((o) => o.isAgreed === false),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phải cung cấp lý do nếu không đồng ý với hợp đồng' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AcknowledgeContractDto.prototype, "note", void 0);
//# sourceMappingURL=acknowledge-contract.dto.js.map