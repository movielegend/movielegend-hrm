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
exports.SalaryComponentsController = exports.SalaryProfilesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const salary_dto_1 = require("./dto/salary.dto");
const salary_service_1 = require("./salary.service");
let SalaryProfilesController = class SalaryProfilesController {
    salary;
    constructor(salary) {
        this.salary = salary;
    }
    create(dto, actor) {
        return this.salary.createProfile(dto, actor);
    }
    findAll() {
        return this.salary.findProfiles();
    }
    findByUser(userId) {
        return this.salary.findProfilesByUser(userId);
    }
    end(id, effectiveTo, actor) {
        return this.salary.endProfile(id, effectiveTo, actor);
    }
};
exports.SalaryProfilesController = SalaryProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('salary_profile.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [salary_dto_1.CreateSalaryProfileDto, Object]),
    __metadata("design:returntype", void 0)
], SalaryProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('salary_profile.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalaryProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, permissions_decorator_1.Permissions)('salary_profile.read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryProfilesController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Post)(':id/end'),
    (0, permissions_decorator_1.Permissions)('salary_profile.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('effectiveTo')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SalaryProfilesController.prototype, "end", null);
exports.SalaryProfilesController = SalaryProfilesController = __decorate([
    (0, swagger_1.ApiTags)('Salary Profiles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('salary-profiles'),
    __metadata("design:paramtypes", [salary_service_1.SalaryService])
], SalaryProfilesController);
let SalaryComponentsController = class SalaryComponentsController {
    salary;
    constructor(salary) {
        this.salary = salary;
    }
    createComponent(dto) {
        return this.salary.createComponent(dto);
    }
    findComponents() {
        return this.salary.findComponents();
    }
    updateComponent(id, dto) {
        return this.salary.updateComponent(id, dto);
    }
    createEmployeeComponent(dto, actor) {
        return this.salary.createEmployeeComponent(dto, actor);
    }
};
exports.SalaryComponentsController = SalaryComponentsController;
__decorate([
    (0, common_1.Post)('salary-components'),
    (0, permissions_decorator_1.Permissions)('salary_component.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [salary_dto_1.CreateSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "createComponent", null);
__decorate([
    (0, common_1.Get)('salary-components'),
    (0, permissions_decorator_1.Permissions)('salary_component.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "findComponents", null);
__decorate([
    (0, common_1.Patch)('salary-components/:id'),
    (0, permissions_decorator_1.Permissions)('salary_component.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "updateComponent", null);
__decorate([
    (0, common_1.Post)('employee-salary-components'),
    (0, permissions_decorator_1.Permissions)('salary_component.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [salary_dto_1.CreateEmployeeSalaryComponentDto, Object]),
    __metadata("design:returntype", void 0)
], SalaryComponentsController.prototype, "createEmployeeComponent", null);
exports.SalaryComponentsController = SalaryComponentsController = __decorate([
    (0, swagger_1.ApiTags)('Salary Components'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [salary_service_1.SalaryService])
], SalaryComponentsController);
//# sourceMappingURL=salary.controller.js.map