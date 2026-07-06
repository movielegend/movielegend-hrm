"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessTimeService = void 0;
const common_1 = require("@nestjs/common");
let BusinessTimeService = class BusinessTimeService {
    timeZone = 'Asia/Ho_Chi_Minh';
    startOfBusinessDate(value) {
        if (typeof value === 'string') {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0));
        }
        return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
    }
    businessDateString(value = new Date()) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: this.timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(value);
    }
    addDays(value, days) {
        return new Date(value.getTime() + days * 86_400_000);
    }
    inclusiveDateRange(fromDate, toDate) {
        if (!fromDate && !toDate)
            return undefined;
        return {
            ...(fromDate ? { gte: this.startOfBusinessDate(fromDate) } : {}),
            ...(toDate ? { lte: this.startOfBusinessDate(toDate) } : {}),
        };
    }
    inclusiveDays(start, end) {
        return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    }
};
exports.BusinessTimeService = BusinessTimeService;
exports.BusinessTimeService = BusinessTimeService = __decorate([
    (0, common_1.Injectable)()
], BusinessTimeService);
//# sourceMappingURL=business-time.service.js.map