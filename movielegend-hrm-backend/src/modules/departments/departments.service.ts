import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { badRequest, notFound } from '../../common/utils/error.util';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: dto,
    });
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
      where: { departmentId: id, leftAt: null },
    });
    if (members > 0) {
      throw badRequest('DEPARTMENT_HAS_MEMBERS', 'Không thể xóa phòng ban còn nhân viên');
    }
    return this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
