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
exports.EmployeeContractsController = exports.ContractTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const contracts_service_1 = require("./contracts.service");
const contract_dto_1 = require("./dto/contract.dto");
const acknowledge_contract_dto_1 = require("./dto/acknowledge-contract.dto");
let ContractTemplatesController = class ContractTemplatesController {
    contracts;
    constructor(contracts) {
        this.contracts = contracts;
    }
    create(dto, actor) {
        return this.contracts.createTemplate(dto, actor);
    }
    findAll() {
        return this.contracts.findTemplates();
    }
    findOne(id) {
        return this.contracts.findTemplate(id);
    }
    update(id, dto, actor) {
        return this.contracts.updateTemplate(id, dto, actor);
    }
};
exports.ContractTemplatesController = ContractTemplatesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('contract_template.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contract_dto_1.CreateContractTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], ContractTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('contract_template.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContractTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('contract_template.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('contract_template.update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.UpdateContractTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], ContractTemplatesController.prototype, "update", null);
exports.ContractTemplatesController = ContractTemplatesController = __decorate([
    (0, swagger_1.ApiTags)('Contract Templates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('contract-templates'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractTemplatesController);
let EmployeeContractsController = class EmployeeContractsController {
    contracts;
    constructor(contracts) {
        this.contracts = contracts;
    }
    create(dto, actor) {
        return this.contracts.createContract(dto, actor);
    }
    findAll(actor, departmentId) {
        return this.contracts.findAll(actor, departmentId);
    }
    findMine(actor) {
        return this.contracts.findMine(actor);
    }
    expiry(days) {
        return this.contracts.expiry(days ? Number(days) : 30);
    }
    acknowledge(id, dto, ipAddress, actor) {
        return this.contracts.acknowledgeContract(id, dto, ipAddress, actor);
    }
    findOne(id, actor) {
        return this.contracts.findOne(id, actor);
    }
    update(id, dto, actor) {
        return this.contracts.updateContract(id, dto, actor);
    }
    submitApproval(id, actor) {
        return this.contracts.submitApproval(id, actor);
    }
    approve(id, actor) {
        return this.contracts.approve(id, actor);
    }
    reject(id, dto, actor) {
        return this.contracts.reject(id, actor, dto);
    }
    requestEmployeeSignature(id, actor) {
        return this.contracts.requestEmployeeSignature(id, actor);
    }
    signEmployee(id, dto, actor) {
        return this.contracts.signEmployee(id, dto, actor);
    }
    signCompany(id, dto, actor) {
        return this.contracts.signCompany(id, dto, actor);
    }
    activate(id, actor) {
        return this.contracts.activate(id, actor);
    }
    terminate(id, dto, actor) {
        return this.contracts.terminate(id, actor, dto);
    }
};
exports.EmployeeContractsController = EmployeeContractsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('contract.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contract_dto_1.CreateEmployeeContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('contract.read_own', 'contract.read_department', 'contract.read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('contract.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('expiry'),
    (0, any_permissions_decorator_1.AnyPermissions)('contract.read_department', 'contract.read_all'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "expiry", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, permissions_decorator_1.Permissions)('contract.read_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, acknowledge_contract_dto_1.AcknowledgeContractDto, String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('contract.read_own', 'contract.read_department', 'contract.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('contract.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.UpdateEmployeeContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/submit-approval'),
    (0, permissions_decorator_1.Permissions)('contract.create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "submitApproval", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)('contract.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)('contract.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.RejectContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/request-employee-signature'),
    (0, permissions_decorator_1.Permissions)('contract.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "requestEmployeeSignature", null);
__decorate([
    (0, common_1.Post)(':id/sign/employee'),
    (0, permissions_decorator_1.Permissions)('contract.read_own'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.SignContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "signEmployee", null);
__decorate([
    (0, common_1.Post)(':id/sign/company'),
    (0, permissions_decorator_1.Permissions)('contract.sign_company'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.SignContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "signCompany", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, permissions_decorator_1.Permissions)('contract.approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/terminate'),
    (0, permissions_decorator_1.Permissions)('contract.terminate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contract_dto_1.TerminateContractDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeContractsController.prototype, "terminate", null);
exports.EmployeeContractsController = EmployeeContractsController = __decorate([
    (0, swagger_1.ApiTags)('Employee Contracts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employee-contracts'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], EmployeeContractsController);
//# sourceMappingURL=contracts.controller.js.map