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
exports.EmployeeRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const employee_request_dto_1 = require("./dto/employee-request.dto");
const employee_requests_service_1 = require("./employee-requests.service");
let EmployeeRequestsController = class EmployeeRequestsController {
    employeeRequestsService;
    constructor(employeeRequestsService) {
        this.employeeRequestsService = employeeRequestsService;
    }
    create(dto, actor) {
        return this.employeeRequestsService.create(dto, actor);
    }
    findAll(actor, departmentId) {
        return this.employeeRequestsService.findAll(actor, departmentId);
    }
    findMine(actor, query) {
        return this.employeeRequestsService.findMine(actor, query);
    }
    approve(id, actor) {
        return this.employeeRequestsService.approve(id, actor);
    }
};
exports.EmployeeRequestsController = EmployeeRequestsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('employee.request'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_request_dto_1.CreateEmployeeRequestDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeRequestsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('employee.request.approve'),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeeRequestsController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('employee.request'),
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, employee_request_dto_1.EmployeeRequestQueryDto]),
    __metadata("design:returntype", void 0)
], EmployeeRequestsController.prototype, "findMine", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('employee.request.approve'),
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeRequestsController.prototype, "approve", null);
exports.EmployeeRequestsController = EmployeeRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Employee Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employee-requests'),
    __metadata("design:paramtypes", [employee_requests_service_1.EmployeeRequestsService])
], EmployeeRequestsController);
//# sourceMappingURL=employee-requests.controller.js.map