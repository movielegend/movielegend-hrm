"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEventsService = void 0;
const common_1 = require("@nestjs/common");
let RealtimeEventsService = class RealtimeEventsService {
    emitFn;
    bind(emitFn) {
        this.emitFn = emitFn;
    }
    emitToUser(userId, event, payload) {
        this.emitFn?.(`user:${userId}`, event, payload);
    }
    emitToDepartment(departmentId, event, payload) {
        this.emitFn?.(`department:${departmentId}`, event, payload);
    }
    emitToRoom(room, event, payload) {
        this.emitFn?.(room, event, payload);
    }
};
exports.RealtimeEventsService = RealtimeEventsService;
exports.RealtimeEventsService = RealtimeEventsService = __decorate([
    (0, common_1.Injectable)()
], RealtimeEventsService);
//# sourceMappingURL=realtime-events.service.js.map