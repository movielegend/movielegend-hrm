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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor() {
        super({
            log: [
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
        });
        this.$on('error', (event) => {
            this.logger.error(event.message);
        });
        this.$on('warn', (event) => {
            this.logger.warn(event.message);
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async nextUserCode(tx) {
        const rows = await tx.$queryRaw `SELECT nextval('user_code_seq')`;
        const value = rows[0]?.nextval;
        if (value === undefined) {
            throw new Error('Không tạo được mã nhân viên');
        }
        return `NV${value.toString().padStart(6, '0')}`;
    }
    async nextTaskCode(tx) {
        const rows = await tx.$queryRaw `SELECT nextval('task_code_seq')`;
        const value = rows[0]?.nextval;
        if (value === undefined) {
            throw new Error('Cannot generate task code');
        }
        return `TASK${value.toString().padStart(6, '0')}`;
    }
    async nextCrossDepartmentRequestCode(tx) {
        const rows = await tx.$queryRaw `SELECT nextval('cross_department_request_code_seq')`;
        const value = rows[0]?.nextval;
        if (value === undefined) {
            throw new Error('Cannot generate cross-department request code');
        }
        return `CDR${value.toString().padStart(6, '0')}`;
    }
    async nextSequenceCode(tx, sequenceName, prefix) {
        const rows = await tx.$queryRawUnsafe(`SELECT nextval('${sequenceName}')`);
        const value = rows[0]?.nextval;
        if (value === undefined) {
            throw new Error(`Cannot generate ${prefix} code`);
        }
        return `${prefix}${value.toString().padStart(6, '0')}`;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map