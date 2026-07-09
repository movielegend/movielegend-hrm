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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const error_util_1 = require("../../common/utils/error.util");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        let companyId = dto.companyId;
        if (!companyId) {
            const company = await this.prisma.company.findFirst();
            if (!company)
                throw (0, error_util_1.badRequest)('NO_COMPANY', 'Không tìm thấy công ty nào trong hệ thống');
            companyId = company.id;
        }
        try {
            return await this.prisma.department.create({
                data: {
                    ...dto,
                    companyId,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw (0, error_util_1.badRequest)('DEPARTMENT_CODE_EXISTS', 'Mã phòng ban đã tồn tại trong hệ thống');
            }
            throw error;
        }
    }
    async findAll(search) {
        const items = await this.prisma.department.findMany({
            where: {
                deletedAt: null,
                ...(search
                    ? {
                        OR: [
                            { code: { contains: search, mode: 'insensitive' } },
                            { name: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async findOne(id) {
        const department = await this.prisma.department.findFirst({
            where: { id, deletedAt: null },
        });
        if (!department)
            throw (0, error_util_1.notFound)('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
        return department;
    }
    update(id, dto) {
        return this.prisma.department.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const members = await this.prisma.departmentMember.count({
            where: { departmentId: id, leftAt: null, user: { deletedAt: null } },
        });
        if (members > 0) {
            throw (0, error_util_1.badRequest)('DEPARTMENT_HAS_MEMBERS', 'Không thể xóa phòng ban còn nhân viên');
        }
        return this.prisma.$transaction(async (tx) => {
            const dept = await tx.department.findUnique({ where: { id } });
            if (!dept)
                throw (0, error_util_1.badRequest)('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
            await tx.departmentMember.updateMany({
                where: { departmentId: id, leftAt: null },
                data: { leftAt: new Date() },
            });
            return tx.department.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    code: `${dept.code}_del_${Date.now()}`
                }
            });
        });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map