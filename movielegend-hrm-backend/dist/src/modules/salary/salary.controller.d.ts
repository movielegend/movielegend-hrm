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
        createdById: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            userCode: string;
            phone: string;
            email: string | null;
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                fullName: string;
                dateOfBirth: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                idCardNumber: string;
                idCardIssueDate: Date | null;
                idCardIssuePlace: string | null;
                idCardFrontUrl: string | null;
                idCardBackUrl: string | null;
                permanentAddress: string | null;
                temporaryAddress: string | null;
                avatarUrl: string | null;
                joinDate: Date | null;
                officialDate: Date | null;
                employmentStatus: import("@prisma/client").$Enums.EmploymentStatus;
                emergencyContactName: string | null;
                emergencyContactPhone: string | null;
                positionId: string | null;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        createdById: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    })[]>;
    findByUser(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        createdById: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }[]>;
    end(id: string, effectiveTo: string, actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        createdById: string;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        standardWorkingDays: import("@prisma/client/runtime/library").Decimal | null;
        salaryType: import("@prisma/client").$Enums.SalaryType;
        standardWorkingHours: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
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
        createdById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        componentId: string;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
