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
exports.EmployeeDocumentsController = exports.DocumentTypesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const employee_document_dto_1 = require("./dto/employee-document.dto");
const employee_documents_service_1 = require("./employee-documents.service");
let DocumentTypesController = class DocumentTypesController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    create(dto) {
        return this.documents.createType(dto);
    }
    findAll(companyId) {
        return this.documents.findTypes(companyId);
    }
    update(id, dto) {
        return this.documents.updateType(id, dto);
    }
};
exports.DocumentTypesController = DocumentTypesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('employee_document.verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_document_dto_1.CreateDocumentTypeDto]),
    __metadata("design:returntype", void 0)
], DocumentTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('employee_document.verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_document_dto_1.UpdateDocumentTypeDto]),
    __metadata("design:returntype", void 0)
], DocumentTypesController.prototype, "update", null);
exports.DocumentTypesController = DocumentTypesController = __decorate([
    (0, swagger_1.ApiTags)('Document Types'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('document-types'),
    __metadata("design:paramtypes", [employee_documents_service_1.EmployeeDocumentsService])
], DocumentTypesController);
let EmployeeDocumentsController = class EmployeeDocumentsController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    create(dto, actor) {
        return this.documents.create(dto, actor);
    }
    findAll(actor, departmentId) {
        return this.documents.findAll(actor, departmentId);
    }
    findMine(actor) {
        return this.documents.findMine(actor);
    }
    expiring(days) {
        return this.documents.expiring(days ? Number(days) : 30);
    }
    findOne(id, actor) {
        return this.documents.findOne(id, actor);
    }
    verify(id, dto, actor) {
        return this.documents.verify(id, dto, actor);
    }
};
exports.EmployeeDocumentsController = EmployeeDocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('employee_document.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_document_dto_1.CreateEmployeeDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, any_permissions_decorator_1.AnyPermissions)('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.Permissions)('employee_document.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('expiring'),
    (0, any_permissions_decorator_1.AnyPermissions)('employee_document.read_department', 'employee_document.read_all'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "expiring", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, any_permissions_decorator_1.AnyPermissions)('employee_document.read_own', 'employee_document.read_department', 'employee_document.read_all'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, permissions_decorator_1.Permissions)('employee_document.verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_document_dto_1.VerifyEmployeeDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], EmployeeDocumentsController.prototype, "verify", null);
exports.EmployeeDocumentsController = EmployeeDocumentsController = __decorate([
    (0, swagger_1.ApiTags)('Employee Documents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employee-documents'),
    __metadata("design:paramtypes", [employee_documents_service_1.EmployeeDocumentsService])
], EmployeeDocumentsController);
//# sourceMappingURL=employee-documents.controller.js.map