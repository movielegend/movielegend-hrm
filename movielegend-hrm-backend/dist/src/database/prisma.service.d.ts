import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    nextUserCode(tx: Prisma.TransactionClient): Promise<string>;
    nextTaskCode(tx: Prisma.TransactionClient): Promise<string>;
    nextCrossDepartmentRequestCode(tx: Prisma.TransactionClient): Promise<string>;
    nextSequenceCode(tx: Prisma.TransactionClient, sequenceName: string, prefix: string): Promise<string>;
}
