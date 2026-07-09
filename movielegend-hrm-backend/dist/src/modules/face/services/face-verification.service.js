"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceVerificationService = void 0;
const common_1 = require("@nestjs/common");
let FaceVerificationService = class FaceVerificationService {
    async verifyAttendanceFace(_input) {
        return {
            matched: true,
            confidence: undefined,
            provider: 'not_configured',
            reason: 'Face verification provider is not configured in Phase 2',
        };
    }
};
exports.FaceVerificationService = FaceVerificationService;
exports.FaceVerificationService = FaceVerificationService = __decorate([
    (0, common_1.Injectable)()
], FaceVerificationService);
//# sourceMappingURL=face-verification.service.js.map