import { SalaryCalculationType, SalaryComponentType, SalaryType } from '@prisma/client';
export declare class CreateSalaryProfileDto {
    userId: string;
    salaryType: SalaryType;
    baseSalary: number;
    standardWorkingDays?: number;
    standardWorkingHours?: number;
    hourlyRate?: number;
    dailyRate?: number;
    currency?: string;
    effectiveFrom: string;
    effectiveTo?: string;
}
export declare class CreateSalaryComponentDto {
    code: string;
    name: string;
    componentType: SalaryComponentType;
    calculationType: SalaryCalculationType;
    defaultAmount?: number;
    formulaKey?: string;
    taxable?: boolean;
    insuranceApplicable?: boolean;
}
export declare class CreateEmployeeSalaryComponentDto {
    userId: string;
    componentId: string;
    amount: number;
    percentage?: number;
    effectiveFrom: string;
    effectiveTo?: string;
}
