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
exports.NotificationPreferencesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const notification_preference_dto_1 = require("./dto/notification-preference.dto");
const notification_preferences_service_1 = require("./notification-preferences.service");
let NotificationPreferencesController = class NotificationPreferencesController {
    preferences;
    constructor(preferences) {
        this.preferences = preferences;
    }
    findMine(actor) {
        return this.preferences.findMine(actor);
    }
    updateMine(dto, actor) {
        return this.preferences.updateMine(dto, actor);
    }
};
exports.NotificationPreferencesController = NotificationPreferencesController;
__decorate([
    (0, common_1.Get)('me'),
    (0, permissions_decorator_1.Permissions)('notification_preference.read_own'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationPreferencesController.prototype, "findMine", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, permissions_decorator_1.Permissions)('notification_preference.update_own'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_preference_dto_1.UpdateNotificationPreferenceDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPreferencesController.prototype, "updateMine", null);
exports.NotificationPreferencesController = NotificationPreferencesController = __decorate([
    (0, swagger_1.ApiTags)('Notification Preferences'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notification-preferences'),
    __metadata("design:paramtypes", [notification_preferences_service_1.NotificationPreferencesService])
], NotificationPreferencesController);
//# sourceMappingURL=notification-preferences.controller.js.map