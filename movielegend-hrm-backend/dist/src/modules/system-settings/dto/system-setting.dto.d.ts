import { SystemSettingCategory } from '@prisma/client';
export declare class UpsertSystemSettingDto {
    companyId: string;
    key: string;
    valueJson: Record<string, unknown>;
    category: SystemSettingCategory;
    description?: string;
    isSensitive?: boolean;
}
