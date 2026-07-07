import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateEmployeeSalaryComponentDto, CreateSalaryComponentDto, CreateSalaryProfileDto } from './dto/salary.dto';
import { SalaryService } from './salary.service';
export declare class SalaryProfilesController {
    private readonly salary;
    constructor(salary: SalaryService);
    create(dto: CreateSalaryProfileDto, actor: AuthenticatedUser): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
            phone: string;
            email: string | null;
            id: string;
            userCode: string;
            profile: {
                userId: string;
                fullName: string;
                positionId: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
            } | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findComponents(): import("@prisma/client").Prisma.PrismaPromise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }[]>;
    updateComponent(id: string, dto: Partial<CreateSalaryComponentDto>): import("@prisma/client").Prisma.Prisma__SalaryComponentClient<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        componentType: import("@prisma/client").$Enums.SalaryComponentType;
        calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
        defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
        formulaKey: string | null;
        taxable: boolean;
        insuranceApplicable: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    createEmployeeComponent(dto: CreateEmployeeSalaryComponentDto, actor: AuthenticatedUser): Promise<{
        component: {
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            componentType: import("@prisma/client").$Enums.SalaryComponentType;
            calculationType: import("@prisma/client").$Enums.SalaryCalculationType;
            defaultAmount: import("@prisma/client/runtime/library").Decimal | null;
            formulaKey: string | null;
            taxable: boolean;
            insuranceApplicable: boolean;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        componentId: string;
        percentage: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
