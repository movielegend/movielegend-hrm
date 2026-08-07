import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async updateRolePermissions(roleId: string, permissionCodes: string[]) {
    // 1. Kiểm tra Role tồn tại
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // 2. Tìm tất cả Permission records từ mã quyền
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    // 3. Thực hiện Transaction xóa cũ và thêm mới
    await this.prisma.$transaction(async (prisma) => {
      // Xóa tất cả RolePermission cũ của roleId
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Tạo mới nếu có permissions
      if (permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId,
            permissionId: p.id,
          })),
        });
      }
    });

    // 4. Return Role mới kèm permissions (giống findAll format)
    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
