import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyId(): Promise<string> {
    const company = await this.prisma.company.findFirst();
    if (!company) throw new BadRequestException('Không tìm thấy công ty nào trong hệ thống');
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

  async findOne(id: string) {
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
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const companyId = await this.getCompanyId();
    const existing = await this.prisma.branch.findFirst({
      where: { companyId, code: dto.code },
    });
    if (existing) throw new ConflictException('Branch code already exists');

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

  async update(id: string, dto: UpdateBranchDto) {
    const companyId = await this.getCompanyId();
    await this.findOne(id);
    
    if (dto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) throw new ConflictException('Branch code already exists');
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

  async remove(id: string) {
    const branch = await this.findOne(id);
    if (branch.departments && branch.departments.length > 0) {
      throw new BadRequestException('Không thể xóa chi nhánh đang có phòng ban trực thuộc');
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
}

