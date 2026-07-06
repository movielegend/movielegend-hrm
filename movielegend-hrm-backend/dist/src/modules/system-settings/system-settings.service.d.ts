import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { UpsertSystemSettingDto } from './dto/system-setting.dto';
export declare class SystemSettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(actor: AuthenticatedUser, companyId?: string): Promise<{
        valueJson: Prisma.JsonValue;
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        category: import("@prisma/client").$Enums.SystemSettingCategory;
        key: string;
        isSensitive: boolean;
        updatedById: string;
    }[]>;
    upsert(dto: UpsertSystemSettingDto, actor: AuthenticatedUser): Prisma.Prisma__SystemSettingClient<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        category: import("@prisma/client").$Enums.SystemSettingCategory;
        key: string;
        valueJson: Prisma.JsonValue;
        isSensitive: boolean;
        updatedById: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
