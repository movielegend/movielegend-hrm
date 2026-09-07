import { Injectable } from '@nestjs/common';
import { RoleScopeType } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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

  async findAll(actor?: AuthenticatedUser) {
    const companyId = await this.getCompanyId();

    // Nếu actor là Admin Miền (scopeType = REGION), chỉ lấy các chi nhánh thuộc miền đó
    let regionIdFilter: string | undefined = undefined;
    if (actor && actor.roles.includes('ADMIN')) {
      const regionScope = actor.scopes?.find(
        (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
      );
      if (regionScope?.scopeId) {
        regionIdFilter = regionScope.scopeId;
      }
    }

    return this.prisma.branch.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(regionIdFilter ? { regionId: regionIdFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        region: {
          select: { id: true, code: true, name: true },
        },
        departments: { 
          where: { deletedAt: null },
          select: { 
            id: true, name: true, code: true,
            _count: { select: { members: { where: { leftAt: null } } } }
          } 
        } 
      },
    });
  }

  async findOne(id: string) {
    const companyId = await this.getCompanyId();
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { 
        region: {
          select: { id: true, code: true, name: true },
        },
        departments: { 
          where: { deletedAt: null },
          select: { 
            id: true, name: true, code: true,
            _count: { select: { members: { where: { leftAt: null } } } }
          } 
        } 
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private getActorRegionScope(actor?: AuthenticatedUser): string | null {
    if (!actor?.roles.includes('ADMIN')) return null;
    const regionScope = actor.scopes?.find(
      (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.REGION && s.scopeId,
    );
    return regionScope?.scopeId ?? null;
  }

  private isGlobalAdmin(actor?: AuthenticatedUser): boolean {
    if (!actor?.roles?.includes('ADMIN')) return false;
    const globalScope = actor.scopes?.find(
      (s) => s.role === 'ADMIN' && s.scopeType === RoleScopeType.GLOBAL,
    );
    return !!globalScope;
  }

  async create(dto: CreateBranchDto, actor?: AuthenticatedUser) {
    const companyId = await this.getCompanyId();

    // Chỉ Super Admin mới được tạo Trụ sở chính
    const isSuperAdmin = this.isGlobalAdmin(actor);
    if (dto.isHeadquarters && !isSuperAdmin) {
      throw new BadRequestException('Chỉ Super Admin mới được phép tạo Trụ sở chính');
    }

    // Admin Miền chỉ được tạo chi nhánh thuộc vùng mình
    const actorRegionId = this.getActorRegionScope(actor);
    if (actorRegionId) {
      if (!dto.regionId || dto.regionId !== actorRegionId) {
        throw new BadRequestException('Admin Miền chỉ được tạo chi nhánh thuộc vùng mình phụ trách');
      }
    }

    const existing = await this.prisma.branch.findFirst({
      where: { companyId, code: dto.code },
    });
    if (existing) throw new ConflictException('Branch code already exists');

    if (dto.isHeadquarters) {
      const existingHQ = await this.prisma.branch.findFirst({
        where: { companyId, isHeadquarters: true, deletedAt: null },
      });
      if (existingHQ) throw new BadRequestException(`Đã có trụ sở chính (${existingHQ.name}). Vui lòng bỏ tích trụ sở chính cũ trước.`);
    }

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
        region: {
          select: { id: true, code: true, name: true },
        },
        departments: { 
          where: { deletedAt: null },
          select: { 
            id: true, name: true, code: true,
            _count: { select: { members: { where: { leftAt: null } } } }
          } 
        } 
      },
    });
  }

  async update(id: string, dto: UpdateBranchDto, actor?: AuthenticatedUser) {
    const companyId = await this.getCompanyId();
    const branch = await this.findOne(id);

    const isSuperAdmin = this.isGlobalAdmin(actor);

    // Admin vùng không được phép sửa bất cứ thông tin gì của Trụ sở chính
    if (branch.isHeadquarters && !isSuperAdmin) {
      throw new BadRequestException('Chỉ Super Admin mới được phép chỉnh sửa Trụ sở chính');
    }

    // Chỉ Super Admin mới được thiết lập/gỡ bỏ Trụ sở chính
    if (dto.isHeadquarters !== undefined && dto.isHeadquarters !== branch.isHeadquarters) {
      if (!isSuperAdmin) throw new BadRequestException('Chỉ Super Admin mới được phép thiết lập hoặc gỡ bỏ Trụ sở chính');
    }

    // Chỉ Super Admin mới được chuyển chi nhánh sang vùng khác
    if (dto.regionId !== undefined && dto.regionId !== branch.regionId) {
      if (!isSuperAdmin) throw new BadRequestException('Chỉ Super Admin mới được phép chuyển chi nhánh sang vùng khác');
    }

    // Admin Miền chỉ được sửa chi nhánh thuộc vùng mình
    const actorRegionId = this.getActorRegionScope(actor);
    if (actorRegionId) {
      if (branch.regionId !== actorRegionId) {
        throw new BadRequestException(`Admin Miền không có quyền sửa chi nhánh ngoài vùng mình phụ trách`);
      }
    }
    
    if (dto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) throw new ConflictException('Branch code already exists');
    }

    if (dto.isHeadquarters) {
      const existingHQ = await this.prisma.branch.findFirst({
        where: { companyId, isHeadquarters: true, deletedAt: null, id: { not: id } },
      });
      if (existingHQ) throw new BadRequestException(`Đã có trụ sở chính (${existingHQ.name}). Vui lòng bỏ tích trụ sở chính cũ trước.`);
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
        region: {
          select: { id: true, code: true, name: true },
        },
        departments: { 
          where: { deletedAt: null },
          select: { 
            id: true, name: true, code: true,
            _count: { select: { members: { where: { leftAt: null } } } }
          } 
        } 
      },
    });
  }

  async remove(id: string, actor?: AuthenticatedUser) {
    const branch = await this.findOne(id);

    // Không cho phép xóa Trụ sở chính nếu không phải Super Admin
    if (branch.isHeadquarters && !this.isGlobalAdmin(actor)) {
      throw new BadRequestException('Chỉ Super Admin mới được phép xóa Trụ sở chính');
    }

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
