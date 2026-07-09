"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unauthorized = exports.notFound = exports.forbidden = exports.conflict = exports.badRequest = void 0;
const common_1 = require("@nestjs/common");
const badRequest = (code, message) => new common_1.BadRequestException({ code, message });
exports.badRequest = badRequest;
const conflict = (code, message) => new common_1.ConflictException({ code, message });
exports.conflict = conflict;
const forbidden = (code, message) => new common_1.ForbiddenException({ code, message });
exports.forbidden = forbidden;
const notFound = (code, message) => new common_1.NotFoundException({ code, message });
exports.notFound = notFound;
const unauthorized = (code, message) => new common_1.UnauthorizedException({ code, message });
exports.unauthorized = unauthorized;
//# sourceMappingURL=error.util.js.map