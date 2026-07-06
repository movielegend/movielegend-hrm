import { Injectable } from '@nestjs/common';
import { conflict, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { CreateMaterialCategoryDto, CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  createCategory(dto: CreateMaterialCategoryDto) {
    return this.prisma.materialCategory.create({ data: dto });
  }

  findCategories() {
    return this.prisma.materialCategory.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateMaterialDto) {
    return this.prisma.$transaction(async (tx) => {
      const code = dto.materialCode ?? (await this.prisma.nextSequenceCode(tx, 'material_code_seq', 'MAT'));
      const existing = await tx.material.findUnique({ where: { materialCode: code } });
      if (existing) throw conflict('MATERIAL_CODE_DUPLICATED', 'Material code already exists');
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

  async findOne(id: string) {
    const material = await this.prisma.material.findFirst({ where: { id, deletedAt: null }, include: { category: true } });
    if (!material) throw notFound('MATERIAL_NOT_FOUND', 'Material not found');
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    return this.prisma.material.update({ where: { id }, data: dto, include: { category: true } });
  }
}
