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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
let MaterialsService = class MaterialsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    createCategory(dto) {
        return this.prisma.materialCategory.create({ data: dto });
    }
    findCategories() {
        return this.prisma.materialCategory.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
    }
    create(dto) {
        return this.prisma.$transaction(async (tx) => {
            const code = dto.materialCode ?? (await this.prisma.nextSequenceCode(tx, 'material_code_seq', 'MAT'));
            const existing = await tx.material.findUnique({ where: { materialCode: code } });
            if (existing)
                throw (0, error_util_1.conflict)('MATERIAL_CODE_DUPLICATED', 'Material code already exists');
            return tx.material.create({
                data: {
                    categoryId: dto.categoryId,
                    materialCode: code,
                    name: dto.name,
                    description: dto.description,
                    unit: dto.unit,
                    minimumStock: dto.minimumStock,
                    maximumStock: dto.maximumStock,
                },
                include: { category: true },
            });
        });
    }
    findAll() {
        return this.prisma.material.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        const material = await this.prisma.material.findFirst({ where: { id, deletedAt: null }, include: { category: true } });
        if (!material)
            throw (0, error_util_1.notFound)('MATERIAL_NOT_FOUND', 'Material not found');
        return material;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.material.update({ where: { id }, data: dto, include: { category: true } });
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map