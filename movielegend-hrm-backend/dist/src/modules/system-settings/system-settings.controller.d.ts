import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpsertSystemSettingDto } from './dto/system-setting.dto';
import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private readonly settings;
    constructor(settings: SystemSettingsService);
    findAll(actor: AuthenticatedUser, companyId?: string): Promise<{
        valueJson: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        companyId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import("@prisma/client").$Enums.SystemSettingCategory;
        key: string;
        isSensitive: boolean;
        updatedById: string;
    }[]>;
    upsert(dto: UpsertSystemSettingDto, actor: AuthenticatedUser): import("@prisma/client").Prisma.Prisma__SystemSettingClient<{
        id: string;
        companyId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import("@prisma/client").$Enums.SystemSettingCategory;
        key: string;
        valueJson: import("@prisma/client/runtime/library").JsonValue;
        isSensitive: boolean;
        updatedById: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
