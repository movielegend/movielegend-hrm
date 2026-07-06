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
exports.ShiftAssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const shift_assignment_dto_1 = require("./dto/shift-assignment.dto");
const shift_request_dto_1 = require("./dto/shift-request.dto");
const shift_assignments_service_1 = require("./shift-assignments.service");
let ShiftAssignmentsController = class ShiftAssignmentsController {
    shiftAssignmentsService;
    constructor(shiftAssignmentsService) {
        this.shiftAssignmentsService = shiftAssignmentsService;
    }
    assign(dto, actor) {
        return this.shiftAssignmentsService.assign(dto, actor);
    }
    mySchedule(actor) {
        return this.shiftAssignmentsService.mySchedule(actor.userId);
    }
    register(dto, actor) {
        return this.shiftAssignmentsService.registerShift(dto, actor);
    }
    swap(dto, actor) {
        return this.shiftAssignmentsService.requestSwap(dto, actor);
    }
};
exports.ShiftAssignmentsController = ShiftAssignmentsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.assign'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_assignment_dto_1.AssignShiftDto, Object]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "assign", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.read'),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "mySchedule", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.register'),
    (0, common_1.Post)('registrations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_request_dto_1.ShiftRegistrationDto, Object]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "register", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('shift.swap'),
    (0, common_1.Post)('swaps'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_request_dto_1.ShiftSwapDto, Object]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "swap", null);
exports.ShiftAssignmentsController = ShiftAssignmentsController = __decorate([
    (0, swagger_1.ApiTags)('Shift Assignments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('shift-assignments'),
    __metadata("design:paramtypes", [shift_assignments_service_1.ShiftAssignmentsService])
], ShiftAssignmentsController);
//# sourceMappingURL=shift-assignments.controller.js.map