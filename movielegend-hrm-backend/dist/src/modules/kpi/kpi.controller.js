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
exports.KpiAssignmentsController = exports.KpiTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const kpi_dto_1 = require("./dto/kpi.dto");
const kpi_service_1 = require("./kpi.service");
let KpiTemplatesController = class KpiTemplatesController {
    kpi;
    constructor(kpi) {
        this.kpi = kpi;
    }
    create(dto, actor) {
        return this.kpi.createTemplate(dto, actor);
    }
    findAll() {
        return this.kpi.findTemplates();
    }
    findOne(id) {
        return this.kpi.findTemplate(id);
    }
    update(id, dto) {
        return this.kpi.updateTemplate(id, dto);
    }
    addCriteria(id, dto) {
        return this.kpi.addCriteria(id, dto);
    }
};
exports.KpiTemplatesController = KpiTemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('kpi_template.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kpi_dto_1.CreateKpiTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], KpiTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('kpi_template.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KpiTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('kpi_template.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpiTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('kpi_template.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kpi_dto_1.UpdateKpiTemplateDto]),
    __metadata("design:returntype", void 0)
], KpiTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/criteria'),
    (0, permissions_decorator_1.Permissions)('kpi_template.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kpi_dto_1.CreateKpiCriteriaDto]),
    __metadata("design:returntype", void 0)
], KpiTemplatesController.prototype, "addCriteria", null);
exports.KpiTemplatesController = KpiTemplatesController = __decorate([
    (0, swagger_1.ApiTags)('KPI Templates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('kpi-templates'),
    __metadata("design:paramtypes", [kpi_service_1.KpiService])
], KpiTemplatesController);
let KpiAssignmentsController = class KpiAssignmentsController {
    kpi;
    constructor(kpi) {
        this.kpi = kpi;
    }
    assign(dto, actor) {
        return this.kpi.assign(dto, actor);
    }
    findMine(actor) {
        return this.kpi.findMine(actor);
    }
    findDepartment(departmentId, actor) {
        return this.kpi.findDepartment(departmentId, actor);
    }
    findOne(id, actor) {
        return this.kpi.findOne(id, actor);
    }
    updateResults(id, dto, actor) {
        return this.kpi.updateResults(id, dto, actor);
    }
    selfSubmit(id, actor) {
        return this.kpi.submitSelf(id, actor);
    }
    leaderReview(id, actor) {
        return this.kpi.leaderReview(id, actor);
    }
    finalize(id, actor) {
        return this.kpi.finalize(id, actor);
    }
};
exports.KpiAssignmentsController = KpiAssignmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('kpi.assign'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kpi_dto_1.CreateKpiAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('kpi.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('department/:departmentId'),
    (0, permissions_decorator_1.Permissions)('kpi.read_department'),
    __param(0, (0, common_1.Param)('departmentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "findDepartment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('kpi.read_own', 'kpi.read_department', 'kpi.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/results'),
    (0, any_permissions_decorator_1.AnyPermissions)('kpi.self_review', 'kpi.leader_review', 'kpi.finalize'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kpi_dto_1.UpdateKpiResultsDto, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "updateResults", null);
__decorate([
    (0, common_1.Post)(':id/self-submit'),
    (0, permissions_decorator_1.Permissions)('kpi.self_review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "selfSubmit", null);
__decorate([
    (0, common_1.Post)(':id/leader-review'),
    (0, permissions_decorator_1.Permissions)('kpi.leader_review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "leaderReview", null);
__decorate([
    (0, common_1.Post)(':id/finalize'),
    (0, permissions_decorator_1.Permissions)('kpi.finalize'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpiAssignmentsController.prototype, "finalize", null);
exports.KpiAssignmentsController = KpiAssignmentsController = __decorate([
    (0, swagger_1.ApiTags)('KPI Assignments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('kpi-assignments'),
    __metadata("design:paramtypes", [kpi_service_1.KpiService])
], KpiAssignmentsController);
//# sourceMappingURL=kpi.controller.js.map