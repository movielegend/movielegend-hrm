import { PrismaService } from '../../database/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';
export declare class ShiftsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateShiftDto): import("@prisma/client").Prisma.Prisma__ShiftClient<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    }[]>;
    update(id: string, dto: UpdateShiftDto): import("@prisma/client").Prisma.Prisma__ShiftClient<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        code: string;
        startTime: string;
        endTime: string;
        breakMinutes: number;
        checkInEarlyMinutes: number;
        checkInLateMinutes: number;
        checkOutEarlyMinutes: number;
        checkOutLateMinutes: number;
        isNightShift: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
