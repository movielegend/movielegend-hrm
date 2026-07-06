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
exports.PerformanceReviewsController = exports.ReviewCyclesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const performance_review_dto_1 = require("./dto/performance-review.dto");
const performance_reviews_service_1 = require("./performance-reviews.service");
let ReviewCyclesController = class ReviewCyclesController {
    reviews;
    constructor(reviews) {
        this.reviews = reviews;
    }
    create(dto, actor) {
        return this.reviews.createCycle(dto, actor);
    }
    findAll() {
        return this.reviews.findCycles();
    }
    findOne(id) {
        return this.reviews.findCycle(id);
    }
    open(id, actor) {
        return this.reviews.openCycle(id, actor);
    }
    advance(id, actor) {
        return this.reviews.advanceStage(id, actor);
    }
    close(id, actor) {
        return this.reviews.closeCycle(id, actor);
    }
    assignReviewer(id, dto) {
        return this.reviews.assignReviewer(id, dto);
    }
};
exports.ReviewCyclesController = ReviewCyclesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('review_cycle.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [performance_review_dto_1.CreateReviewCycleDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('review_cycle.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('review_cycle.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/open'),
    (0, permissions_decorator_1.Permissions)('review_cycle.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "open", null);
__decorate([
    (0, common_1.Post)(':id/advance-stage'),
    (0, permissions_decorator_1.Permissions)('review_cycle.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "advance", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, permissions_decorator_1.Permissions)('review_cycle.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/reviewers'),
    (0, permissions_decorator_1.Permissions)('review_cycle.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, performance_review_dto_1.AssignReviewerDto]),
    __metadata("design:returntype", void 0)
], ReviewCyclesController.prototype, "assignReviewer", null);
exports.ReviewCyclesController = ReviewCyclesController = __decorate([
    (0, swagger_1.ApiTags)('Performance Review Cycles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('review-cycles'),
    __metadata("design:paramtypes", [performance_reviews_service_1.PerformanceReviewsService])
], ReviewCyclesController);
let PerformanceReviewsController = class PerformanceReviewsController {
    reviews;
    constructor(reviews) {
        this.reviews = reviews;
    }
    findMine(actor) {
        return this.reviews.findMine(actor);
    }
    findDepartment(departmentId, actor) {
        return this.reviews.findDepartment(departmentId, actor);
    }
    findOne(id, actor) {
        return this.reviews.findOne(id, actor);
    }
    selfSubmit(id, dto, actor) {
        return this.reviews.selfSubmit(id, dto, actor);
    }
    leaderSubmit(id, dto, actor) {
        return this.reviews.leaderSubmit(id, dto, actor);
    }
    finalize(id, dto, actor) {
        return this.reviews.finalize(id, dto, actor);
    }
};
exports.PerformanceReviewsController = PerformanceReviewsController;
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('performance_review.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('department/:departmentId'),
    (0, permissions_decorator_1.Permissions)('performance_review.read_department'),
    __param(0, (0, common_1.Param)('departmentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "findDepartment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('performance_review.read_own', 'performance_review.read_department', 'performance_review.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/self-submit'),
    (0, permissions_decorator_1.Permissions)('performance_review.self_submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, performance_review_dto_1.SubmitReviewDto, Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "selfSubmit", null);
__decorate([
    (0, common_1.Post)(':id/leader-submit'),
    (0, permissions_decorator_1.Permissions)('performance_review.leader_submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, performance_review_dto_1.SubmitReviewDto, Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "leaderSubmit", null);
__decorate([
    (0, common_1.Post)(':id/finalize'),
    (0, permissions_decorator_1.Permissions)('performance_review.finalize'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, performance_review_dto_1.SubmitReviewDto, Object]),
    __metadata("design:returntype", void 0)
], PerformanceReviewsController.prototype, "finalize", null);
exports.PerformanceReviewsController = PerformanceReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Performance Reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('performance-reviews'),
    __metadata("design:paramtypes", [performance_reviews_service_1.PerformanceReviewsService])
], PerformanceReviewsController);
//# sourceMappingURL=performance-reviews.controller.js.map