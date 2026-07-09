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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferencesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const MANDATORY_TYPES = new Set([
    client_1.NotificationType.PAYSLIP_AVAILABLE,
    client_1.NotificationType.CONTRACT_SIGNATURE_REQUIRED,
    client_1.NotificationType.DOCUMENT_REJECTED,
    client_1.NotificationType.KPI_FINALIZED,
]);
let NotificationPreferencesService = class NotificationPreferencesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findMine(actor) {
        return this.prisma.userNotificationPreference.findMany({ where: { userId: actor.userId }, orderBy: { notificationType: 'asc' } });
    }
    updateMine(dto, actor) {
        if (MANDATORY_TYPES.has(dto.notificationType) && dto.inAppEnabled === false) {
            throw (0, error_util_1.badRequest)('MANDATORY_NOTIFICATION_CANNOT_DISABLE', 'Mandatory in-app notification cannot be disabled');
        }
        return this.prisma.userNotificationPreference.upsert({
            where: { userId_notificationType: { userId: actor.userId, notificationType: dto.notificationType } },
            update: {
                inAppEnabled: dto.inAppEnabled,
                pushEnabled: dto.pushEnabled,
                emailEnabled: dto.emailEnabled,
            },
            create: {
                userId: actor.userId,
                notificationType: dto.notificationType,
                inAppEnabled: dto.inAppEnabled ?? true,
                pushEnabled: dto.pushEnabled ?? true,
                emailEnabled: dto.emailEnabled ?? false,
            },
        });
    }
};
exports.NotificationPreferencesService = NotificationPreferencesService;
exports.NotificationPreferencesService = NotificationPreferencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationPreferencesService);
//# sourceMappingURL=notification-preferences.service.js.map