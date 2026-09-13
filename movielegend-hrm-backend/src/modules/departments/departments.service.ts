import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { badRequest, notFound } from '../../common/utils/error.util';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentScopeService } from '../phase2-policy/department-scope.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopes: DepartmentScopeService,
  ) {}

  async create(dto: CreateDepartmentDto) {
    let companyId = dto.companyId;
    if (!companyId) {
      const company = await this.prisma.company.findFirst();
      if (!company) throw badRequest('NO_COMPANY', 'Không tìm thấy công ty nào trong hệ thống');
      companyId = company.id;
    }

    let name = dto.name.trim();
    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { name: true },
      });
      if (branch?.name) {
        const cleanBranch = branch.name.replace(/^chi nhánh\s+/i, '').trim();
        const hasBranch = name.toLowerCase().includes(cleanBranch.toLowerCase()) ||
          name.toLowerCase().includes(branch.name.toLowerCase());
        if (!hasBranch) {
          name = `${name} (${cleanBranch})`;
        }
      }
    }
    
    try {
      return await this.prisma.department.create({
        data: {
          ...dto,
          name,
          companyId,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw badRequest('DEPARTMENT_CODE_EXISTS', 'Mã phòng ban đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  async findAll(search?: string, user?: import('../../common/interfaces/authenticated-user.interface').AuthenticatedUser, ignoreScope?: boolean) {
    let scopeFilter: any = {};
    if (user && !ignoreScope) {
      if (this.scopes.isRegionAdmin(user)) {
        const visibleDepts = await this.scopes.getVisibleDepartmentIds(user);
        if (visibleDepts !== null) {
          scopeFilter = { id: { in: visibleDepts.length > 0 ? visibleDepts : ['00000000-0000-0000-0000-000000000000'] } };
        }
      }
    }

    const items = await this.prisma.department.findMany({
      where: {
        deletedAt: null,
        ...scopeFilter,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { branch: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        branch: { 
          select: { 
            id: true, 
            name: true,
            region: { select: { id: true, name: true } }
          } 
        },
        _count: { select: { members: { where: { leftAt: null } } } },
        leader: {
          select: {
            id: true,
            userCode: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!department) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    let name = dto.name ? dto.name.trim() : undefined;
    if (name) {
      let targetBranchId = dto.branchId;
      if (!targetBranchId) {
        const current = await this.prisma.department.findUnique({ where: { id }, select: { branchId: true } });
        targetBranchId = current?.branchId ?? undefined;
      }
      if (targetBranchId) {
        const branch = await this.prisma.branch.findUnique({ where: { id: targetBranchId }, select: { name: true } });
        if (branch?.name) {
          const cleanBranch = branch.name.replace(/^chi nhánh\s+/i, '').trim();
          const hasBranch = name.toLowerCase().includes(cleanBranch.toLowerCase()) ||
            name.toLowerCase().includes(branch.name.toLowerCase());
          if (!hasBranch) {
            name = `${name} (${cleanBranch})`;
          }
        }
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...dto,
        ...(name ? { name } : {}),
      },
    });
  }

  async remove(id: string) {
    const members = await this.prisma.departmentMember.count({
      where: { departmentId: id, leftAt: null, user: { deletedAt: null } },
    });
    if (members > 0) {
      throw badRequest('DEPARTMENT_HAS_MEMBERS', 'Không thể xóa phòng ban còn nhân viên');
    }
    return this.prisma.$transaction(async (tx) => {
      const dept = await tx.department.findUnique({ where: { id } });
      if (!dept) throw badRequest('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
      
      // Khi xóa phòng ban, cập nhật leftAt cho toàn bộ nhân viên thuộc phòng ban này
      await tx.departmentMember.updateMany({
        where: { departmentId: id, leftAt: null },
        data: { leftAt: new Date() },
      });
      
      // Soft delete phòng ban và đổi mã để tránh lỗi trùng lặp khi tạo mới
      return tx.department.update({
        where: { id },
        data: { 
          deletedAt: new Date(),
          code: `${dept.code}_del_${Date.now()}`
        }
      });
    });
  }
}
