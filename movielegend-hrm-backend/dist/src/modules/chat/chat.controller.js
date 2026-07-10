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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    getMyGroups(user) {
        return this.chatService.getMyGroups(user.userId);
    }
    getMessages(groupId, skip, take) {
        return this.chatService.getMessages(groupId, skip ? Number(skip) : 0, take ? Number(take) : 50);
    }
    sendMessage(groupId, dto, user) {
        return this.chatService.sendMessage(user.userId, groupId, dto);
    }
    getAllGroups(search) {
        return this.chatService.getAllGroups(search);
    }
    createDirectChat(user, targetUserId) {
        return this.chatService.createDirectChat(user.userId, targetUserId);
    }
    createCustomGroup(user, name, memberIds) {
        return this.chatService.createCustomGroup(user.userId, name, memberIds);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách nhóm chat của tôi' }),
    (0, common_1.Get)('my-groups'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getMyGroups", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy tin nhắn trong nhóm chat' }),
    (0, common_1.Get)('groups/:groupId/messages'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Gửi tin nhắn (REST fallback)' }),
    (0, common_1.Post)('groups/:groupId/messages'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.CreateChatMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy tất cả nhóm chat (Admin)' }),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Get)('admin/groups'),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getAllGroups", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Tạo chat 1-1' }),
    (0, common_1.Post)('direct'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "createDirectChat", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Tạo nhóm chat tuỳ chỉnh' }),
    (0, common_1.Post)('custom'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('memberIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "createCustomGroup", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map