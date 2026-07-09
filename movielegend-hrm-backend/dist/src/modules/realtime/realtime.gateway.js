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
exports.RealtimeGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const client_1 = require("@prisma/client");
const socket_io_1 = require("socket.io");
const realtime_events_service_1 = require("./realtime-events.service");
let RealtimeGateway = class RealtimeGateway {
    jwt;
    config;
    realtime;
    server;
    constructor(jwt, config, realtime) {
        this.jwt = jwt;
        this.config = config;
        this.realtime = realtime;
    }
    afterInit() {
        this.realtime.bind((room, event, payload) => this.server.to(room).emit(event, payload));
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            client.data.userId = payload.sub;
            client.data.roles = payload.roles ?? [];
            client.data.scopes = payload.scopes ?? [];
            client.join(`user:${payload.sub}`);
            for (const scope of payload.scopes ?? []) {
                if (scope.scopeId)
                    client.join(`department:${scope.scopeId}`);
            }
        }
        catch {
            client.disconnect(true);
        }
    }
    handleWarehouseJoin(client, payload) {
        const warehouseId = payload?.warehouseId;
        if (!warehouseId)
            return { ok: false, code: 'WAREHOUSE_ID_REQUIRED' };
        const roles = (client.data.roles ?? []);
        const scopes = (client.data.scopes ?? []);
        const allowed = roles.includes('ADMIN') ||
            scopes.some((scope) => scope.role === 'WAREHOUSE_MANAGER' &&
                scope.scopeType === client_1.RoleScopeType.WAREHOUSE &&
                scope.scopeId === warehouseId);
        if (!allowed)
            return { ok: false, code: 'FORBIDDEN_WAREHOUSE_ROOM' };
        client.join(`warehouse:${warehouseId}`);
        return { ok: true };
    }
    handleChatJoin(client, payload) {
        if (payload?.groupId) {
            client.join(`group:${payload.groupId}`);
            return { ok: true };
        }
        const departmentId = payload?.departmentId;
        if (!departmentId)
            return { ok: false, code: 'DEPARTMENT_ID_OR_GROUP_ID_REQUIRED' };
        client.join(`department:${departmentId}`);
        return { ok: true };
    }
    extractToken(client) {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken)
            return authToken.replace(/^Bearer\s+/i, '');
        const header = client.handshake.headers.authorization;
        if (typeof header === 'string' && header)
            return header.replace(/^Bearer\s+/i, '');
        throw new Error('Missing token');
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('warehouse:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleWarehouseJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleChatJoin", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ cors: { origin: true, credentials: true }, namespace: '/hrm' }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        realtime_events_service_1.RealtimeEventsService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map