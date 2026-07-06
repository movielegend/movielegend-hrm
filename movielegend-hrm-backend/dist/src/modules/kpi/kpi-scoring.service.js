"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiScoringService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
let KpiScoringService = class KpiScoringService {
    validateWeightTotal(items) {
        const total = items.reduce((sum, item) => sum + Number(item.weight), 0);
        if (Math.abs(total - 100) > 0.001) {
            throw (0, error_util_1.badRequest)('KPI_WEIGHT_TOTAL_INVALID', 'KPI criteria weight total must equal 100');
        }
    }
    calculateWeightedScore(items) {
        const total = items.reduce((sum, item) => sum + this.clamp(Number(item.score ?? 0)) * Number(item.weight) / 100, 0);
        return {
            score: Math.round(total * 100) / 100,
            explanation: items.map((item) => ({
                score: this.clamp(Number(item.score ?? 0)),
                weight: Number(item.weight),
                weighted: Math.round((this.clamp(Number(item.score ?? 0)) * Number(item.weight) / 100) * 100) / 100,
            })),
        };
    }
    scoreByMethod(method, actual, target, manualScore) {
        if (manualScore !== undefined && manualScore !== null)
            return this.clamp(manualScore);
        if (method === client_1.KpiScoringMethod.BOOLEAN)
            return actual === 'true' ? 100 : 0;
        if (method === client_1.KpiScoringMethod.PERCENTAGE)
            return this.clamp(Number(actual ?? 0));
        if (method === client_1.KpiScoringMethod.TARGET_RATIO) {
            const targetNumber = Number(target ?? 0);
            if (!targetNumber)
                return 0;
            return this.clamp((Number(actual ?? 0) / targetNumber) * 100);
        }
        return 0;
    }
    clamp(score) {
        if (Number.isNaN(score))
            return 0;
        return Math.min(100, Math.max(0, score));
    }
};
exports.KpiScoringService = KpiScoringService;
exports.KpiScoringService = KpiScoringService = __decorate([
    (0, common_1.Injectable)()
], KpiScoringService);
//# sourceMappingURL=kpi-scoring.service.js.map