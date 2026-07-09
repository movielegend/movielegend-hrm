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
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const SECRET_KEY_PATTERN = /(secret|password|token|database_url|credential|private_key)/i;
let SystemSettingsService = class SystemSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(actor, companyId) {
        const rows = await this.prisma.systemSetting.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { key: 'asc' }] });
        const canSeeSensitive = actor.roles.includes('ADMIN');
        return rows.map((row) => ({
            ...row,
            valueJson: row.isSensitive && !canSeeSensitive ? { masked: true } : row.valueJson,
        }));
    }
    upsert(dto, actor) {
        if (SECRET_KEY_PATTERN.test(dto.key)) {
            throw (0, error_util_1.forbidden)('SECRET_SETTING_NOT_ALLOWED', 'Production secrets must stay in environment variables');
        }
        return this.prisma.systemSetting.upsert({
            where: { companyId_key: { companyId: dto.companyId, key: dto.key } },
            update: {
                valueJson: dto.valueJson,
                category: dto.category,
                description: dto.description,
                isSensitive: dto.isSensitive ?? false,
                updatedById: actor.userId,
            },
            create: {
                companyId: dto.companyId,
                key: dto.key,
                valueJson: dto.valueJson,
                category: dto.category,
                description: dto.description,
                isSensitive: dto.isSensitive ?? false,
                updatedById: actor.userId,
            },
        });
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map