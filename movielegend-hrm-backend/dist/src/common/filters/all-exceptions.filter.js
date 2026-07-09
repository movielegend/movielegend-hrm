"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const body = exception instanceof common_1.HttpException ? exception.getResponse() : undefined;
        const message = this.resolveMessage(body, exception);
        const code = typeof body === 'object' && body?.code ? body.code : this.codeFromStatus(status);
        if (status >= 500) {
            this.logger.error(exception instanceof Error ? exception.stack : String(exception));
        }
        response.status(status).json({
            success: false,
            error: {
                code,
                message,
            },
        });
    }
    resolveMessage(body, exception) {
        if (typeof body === 'string')
            return body;
        if (Array.isArray(body?.message))
            return body.message.join('; ');
        if (body?.message)
            return body.message;
        if (exception instanceof Error && exception.message)
            return exception.message;
        return 'Có lỗi xảy ra';
    }
    codeFromStatus(status) {
        const map = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            429: 'RATE_LIMITED',
            500: 'INTERNAL_SERVER_ERROR',
        };
        return map[status] ?? 'ERROR';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map