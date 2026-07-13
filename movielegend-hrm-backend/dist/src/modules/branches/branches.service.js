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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const common_2 = require("@nestjs/common");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyId() {
        const company = await this.prisma.company.findFirst();
        if (!company)
            throw new common_2.BadRequestException('Không tìm thấy công ty nào trong hệ thống');
        return company.id;
    }
    async findAll() {
        const companyId = await this.getCompanyId();
        return this.prisma.branch.findMany({
            where: { companyId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                departments: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, code: true }
                }
            },
        });
    }
    async findOne(id) {
        const companyId = await this.getCompanyId();
        const branch = await this.prisma.branch.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                departments: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, code: true }
                }
            },
        });
        if (!branch)
            throw new common_2.NotFoundException('Branch not found');
        return branch;
    }
    async create(dto) {
        const companyId = await this.getCompanyId();
        const existing = await this.prisma.branch.findFirst({
            where: { companyId, code: dto.code },
        });
        if (existing)
            throw new common_2.ConflictException('Branch code already exists');
        const { departmentIds, ...rest } = dto;
        return this.prisma.branch.create({
            data: {
                ...rest,
                companyId,
                departments: departmentIds ? {
                    connect: departmentIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                departments: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, code: true }
                }
            },
        });
    }
    async update(id, dto) {
        const companyId = await this.getCompanyId();
        await this.findOne(id);
        if (dto.code) {
            const existing = await this.prisma.branch.findFirst({
                where: { companyId, code: dto.code, id: { not: id } },
            });
            if (existing)
                throw new common_2.ConflictException('Branch code already exists');
        }
        const { departmentIds, ...rest } = dto;
        return this.prisma.branch.update({
            where: { id },
            data: {
                ...rest,
                departments: departmentIds ? {
                    set: departmentIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                departments: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, code: true }
                }
            },
        });
    }
    async remove(id) {
        const branch = await this.findOne(id);
        if (branch.departments && branch.departments.length > 0) {
            throw new common_2.BadRequestException('Không thể xóa chi nhánh đang có phòng ban trực thuộc');
        }
        return this.prisma.branch.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async restoreDeleted() {
        return this.prisma.branch.updateMany({
            where: { deletedAt: { not: null } },
            data: { deletedAt: null },
        });
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map