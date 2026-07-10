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
exports.CreateChatMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateChatMessageDto {
    content;
    fileUrl;
    fileType;
    fileName;
    mentions;
}
exports.CreateChatMessageDto = CreateChatMessageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nội dung tin nhắn' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Đường dẫn file đính kèm' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Loại file đính kèm (IMAGE/DOCUMENT)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "fileType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tên file' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateChatMessageDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Danh sách ID user được nhắc tên', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateChatMessageDto.prototype, "mentions", void 0);
//# sourceMappingURL=chat.dto.js.map