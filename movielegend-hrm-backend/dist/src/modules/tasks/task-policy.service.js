"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPolicyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const error_util_1 = require("../../common/utils/error.util");
let TaskPolicyService = class TaskPolicyService {
    assertAssignmentTransition(from, to) {
        const allowed = {
            NEW: [client_1.TaskAssignmentStatus.ACCEPTED, client_1.TaskAssignmentStatus.CANCELLED],
            ACCEPTED: [client_1.TaskAssignmentStatus.IN_PROGRESS, client_1.TaskAssignmentStatus.CANCELLED],
            IN_PROGRESS: [client_1.TaskAssignmentStatus.WAITING_REVIEW, client_1.TaskAssignmentStatus.CANCELLED],
            WAITING_REVIEW: [client_1.TaskAssignmentStatus.COMPLETED, client_1.TaskAssignmentStatus.REJECTED],
            REJECTED: [client_1.TaskAssignmentStatus.IN_PROGRESS, client_1.TaskAssignmentStatus.CANCELLED],
            COMPLETED: [],
            CANCELLED: [],
        };
        if (!allowed[from].includes(to)) {
            throw (0, error_util_1.badRequest)('INVALID_TASK_STATUS_TRANSITION', `Cannot move assignment from ${from} to ${to}`);
        }
    }
};
exports.TaskPolicyService = TaskPolicyService;
exports.TaskPolicyService = TaskPolicyService = __decorate([
    (0, common_1.Injectable)()
], TaskPolicyService);
//# sourceMappingURL=task-policy.service.js.map