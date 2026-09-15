import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCompanyId(): Promise<string> {
    const company = await this.prisma.company.findFirst();
    if (!company) throw new BadRequestException('Không tìm thấy công ty nào trong hệ thống');
    return company.id;
  }

  async findAll(actor?: AuthenticatedUser) {
    const companyId = await this.getCompanyId();
    
    // Nếu actor là Admin Miền (scopeType = REGION), chỉ lấy Region của mình
    let regionIdFilter: string | undefined = undefined;
    if (actor && actor.roles.includes('ADMIN')) {
      const regionScope = actor.scopes?.find(
        (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
      );
      if (regionScope?.scopeId) {
        regionIdFilter = regionScope.scopeId;
      }
    }

    return this.prisma.region.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(regionIdFilter ? { id: regionIdFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        branches: {
          where: { deletedAt: null },
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            allowedRadius: true,
            isActive: true,
            departments: {
              where: { deletedAt: null },
              select: {
                id: true,
                code: true,
                name: true,
                _count: { select: { members: { where: { leftAt: null } } } },
              },
            },
            _count: { select: { departments: { where: { deletedAt: null } } } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const companyId = await this.getCompanyId();
    const region = await this.prisma.region.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        branches: {
          where: { deletedAt: null },
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            allowedRadius: true,
            isActive: true,
            departments: {
              where: { deletedAt: null },
              select: {
                id: true,
                code: true,
                name: true,
                _count: { select: { members: { where: { leftAt: null } } } },
              },
            },
          },
        },
      },
    });
    if (!region) throw new NotFoundException('Không tìm thấy vùng miền');
    return region;
  }

  async create(dto: CreateRegionDto) {
    const companyId = await this.getCompanyId();
    const existing = await this.prisma.region.findFirst({
      where: { companyId, code: dto.code },
    });
    if (existing) throw new ConflictException('Mã vùng miền đã tồn tại');

    return this.prisma.region.create({
      data: {
        ...dto,
        companyId,
      },
      include: {
        branches: true,
      },
    });
  }

  async update(id: string, dto: UpdateRegionDto) {
    const companyId = await this.getCompanyId();
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.region.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) throw new ConflictException('Mã vùng miền đã tồn tại');
    }

    return this.prisma.region.update({
      where: { id },
      data: dto,
      include: {
        branches: true,
      },
    });
  }

  async remove(id: string) {
    const region = await this.findOne(id);
    if (region.branches && region.branches.length > 0) {
      throw new BadRequestException('Không thể xóa vùng miền đang có chi nhánh trực thuộc');
    }
    return this.prisma.region.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restoreDeleted() {
    return this.prisma.region.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    });
  }
}
