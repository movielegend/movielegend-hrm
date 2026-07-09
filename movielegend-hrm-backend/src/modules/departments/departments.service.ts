import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { badRequest, notFound } from '../../common/utils/error.util';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    let companyId = dto.companyId;
    if (!companyId) {
      const company = await this.prisma.company.findFirst();
      if (!company) throw badRequest('NO_COMPANY', 'Không tìm thấy công ty nào trong hệ thống');
      companyId = company.id;
    }
    
    try {
      return await this.prisma.department.create({
        data: {
          ...dto,
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

  async findAll(search?: string) {
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

  async findOne(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!department) throw notFound('DEPARTMENT_NOT_FOUND', 'Không tìm thấy phòng ban');
    return department;
  }

  update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({
      where: { id },
      data: dto,
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
