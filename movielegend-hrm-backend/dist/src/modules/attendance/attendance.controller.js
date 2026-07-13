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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const any_permissions_decorator_1 = require("../../common/decorators/any-permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const attendance_service_1 = require("./attendance.service");
const attendance_dto_1 = require("./dto/attendance.dto");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    checkIn(dto, actor, ip) {
        return this.attendanceService.checkIn(dto, actor, ip);
    }
    checkOut(dto, actor, ip) {
        return this.attendanceService.checkOut(dto, actor, ip);
    }
    createAdjustment(dto, actor) {
        return this.attendanceService.createAdjustment(dto, actor);
    }
    approveAdjustment(id, actor) {
        return this.attendanceService.approveAdjustment(id, actor);
    }
    findAll(actor, query) {
        return this.attendanceService.findAll(actor, query);
    }
    getDashboardStats(actor, query) {
        return this.attendanceService.getDashboardStats(actor, query);
    }
    current(actor) {
        return this.attendanceService.current(actor);
    }
    myHistory(actor, query) {
        return this.attendanceService.myHistory(actor, query);
    }
    activeLocations(actor) {
        return this.attendanceService.activeLocations(actor);
    }
    detail(id, actor) {
        return this.attendanceService.detail(id, actor);
    }
    createLocation(dto) {
        return this.attendanceService.createLocation(dto);
    }
    updateLocation(id, dto) {
        return this.attendanceService.updateLocation(id, dto);
    }
    removeLocation(id) {
        return this.attendanceService.removeLocation(id);
    }
    createWifi(dto) {
        return this.attendanceService.createWifi(dto);
    }
    track(dto, actor) {
        return this.attendanceService.trackLocation(dto, actor.userId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.checkin'),
    (0, common_1.Post)('check-in'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CheckInDto, Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.checkin'),
    (0, common_1.Post)('check-out'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CheckOutDto, Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.adjust'),
    (0, common_1.Post)('adjustments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CreateAttendanceAdjustmentDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createAdjustment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.adjust'),
    (0, common_1.Post)('adjustments/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "approveAdjustment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.read'),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.read'),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getDashboardStats", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('attendance.checkin', 'attendance.read'),
    (0, common_1.Get)('current'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "current", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('attendance.checkin', 'attendance.read'),
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.AttendanceQueryDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "myHistory", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('attendance.checkin', 'attendance.read'),
    (0, common_1.Get)('locations/active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "activeLocations", null);
__decorate([
    (0, any_permissions_decorator_1.AnyPermissions)('attendance.checkin', 'attendance.read'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "detail", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.location.manage'),
    (0, common_1.Post)('locations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CreateAttendanceLocationDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createLocation", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.location.manage'),
    (0, common_1.Patch)('locations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attendance_dto_1.UpdateAttendanceLocationDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "updateLocation", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.location.manage'),
    (0, common_1.Delete)('locations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "removeLocation", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.location.manage'),
    (0, common_1.Post)('wifi-configs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.CreateWifiConfigDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createWifi", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('attendance.checkin'),
    (0, common_1.Post)('location-tracking'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.TrackLocationDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "track", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map