import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateEmployeeSalaryComponentDto, CreateSalaryComponentDto, CreateSalaryProfileDto } from './dto/salary.dto';
import { SalaryService } from './salary.service';
export declare class SalaryProfilesController {
    private readonly salary;
    constructor(salary: SalaryService);
    create(dto: CreateSalaryProfileDto, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        createdById: string;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string | null;
            phone: string;
            userCode: string;
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                fullName: string;
                dateOfBirth: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                idCardNumber: string;
                idCardIssueDate: Date | null;
                idCardIssuePlace: string | null;
                permanentAddress: string | null;
                temporaryAddress: string | null;
                avatarUrl: string | null;
                joinDate: Date | null;
                officialDate: Date | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                emergencyContactName: string | null;
                emergencyContactPhone: string | null;
                positionId: string | null;
                userId: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        createdById: string;
    })[]>;
    findByUser(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        createdById: string;
    }[]>;
    end(id: string, effectiveTo: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        createdById: string;
    }>;
}
export declare class SalaryComponentsController {
    private readonly salary;
    constructor(salary: SalaryService);
    createComponent(dto: CreateSalaryComponentDto): import("@prisma/client").Prisma.Prisma__SalaryComponentClient<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findComponents(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }[]>;
    updateComponent(id: string, dto: Partial<CreateSalaryComponentDto>): import("@prisma/client").Prisma.Prisma__SalaryComponentClient<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    createEmployeeComponent(dto: CreateEmployeeSalaryComponentDto, actor: AuthenticatedUser): Promise<{
        component: {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            componentType: import("@prisma/client").$Enums.SalaryComponentType;
            calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
            defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
            formulaKey: string | null;
            taxable: boolean;
            insuranceApplicable: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        createdById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        componentId: string;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
