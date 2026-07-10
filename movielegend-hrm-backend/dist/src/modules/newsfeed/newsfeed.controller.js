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
exports.NewsfeedController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const newsfeed_service_1 = require("./newsfeed.service");
const newsfeed_dto_1 = require("./dto/newsfeed.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let NewsfeedController = class NewsfeedController {
    newsfeedService;
    constructor(newsfeedService) {
        this.newsfeedService = newsfeedService;
    }
    createPost(dto, user) {
        return this.newsfeedService.createPost(user.userId, dto);
    }
    getPosts(departmentId) {
        return this.newsfeedService.getPosts(departmentId);
    }
    getPostById(id) {
        return this.newsfeedService.getPostById(id);
    }
    likePost(id, user) {
        return this.newsfeedService.likePost(user.userId, id);
    }
    addComment(id, dto, user) {
        return this.newsfeedService.addComment(user.userId, id, dto);
    }
    deletePost(id) {
        return this.newsfeedService.deletePost(id);
    }
};
exports.NewsfeedController = NewsfeedController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Tạo bài đăng mới' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [newsfeed_dto_1.CreateNewsfeedPostDto, Object]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "createPost", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách bài đăng (toàn công ty hoặc theo phòng ban)' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "getPosts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết 1 bài đăng (kèm bình luận)' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "getPostById", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Thích / Bỏ thích bài đăng' }),
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "likePost", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Bình luận vào bài đăng' }),
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, newsfeed_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "addComment", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Xóa bài đăng (Admin kiểm duyệt)' }),
    (0, permissions_decorator_1.Permissions)('user.manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NewsfeedController.prototype, "deletePost", null);
exports.NewsfeedController = NewsfeedController = __decorate([
    (0, swagger_1.ApiTags)('newsfeed'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('newsfeed'),
    __metadata("design:paramtypes", [newsfeed_service_1.NewsfeedService])
], NewsfeedController);
//# sourceMappingURL=newsfeed.controller.js.map