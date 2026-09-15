import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
    this.$on('error' as never, (event: Prisma.LogEvent) => {
      this.logger.error(event.message);
    });
    this.$on('warn' as never, (event: Prisma.LogEvent) => {
      this.logger.warn(event.message);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.ensureSequences();
  }

  async ensureSequences(): Promise<void> {
    const sequences = [
      'user_code_seq',
      'task_code_seq',
      'cross_department_request_code_seq',
      'contract_code_seq',
      'warehouse_code_seq',
      'asset_code_seq',
      'stock_receipt_code_seq',
      'material_issue_code_seq',
      'stock_transfer_code_seq',
      'stock_transaction_code_seq',
      'inventory_check_code_seq',
      'payroll_period_code_seq',
      'material_code_seq',
    ];
    for (const seq of sequences) {
      try {
        await this.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}" START 1`);
      } catch (err: any) {
        this.logger.warn(`Could not create sequence ${seq}: ${err.message}`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async nextUserCode(tx: Prisma.TransactionClient): Promise<string> {
    await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "user_code_seq" START 1`);
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Không tạo được mã nhân viên');
    }
    return `NV${value.toString().padStart(6, '0')}`;
  }

  async nextTaskCode(tx: Prisma.TransactionClient): Promise<string> {
    await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "task_code_seq" START 1`);
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('task_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Cannot generate task code');
    }
    return `TASK${value.toString().padStart(6, '0')}`;
  }

  async nextCrossDepartmentRequestCode(tx: Prisma.TransactionClient): Promise<string> {
    await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "cross_department_request_code_seq" START 1`);
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('cross_department_request_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Cannot generate cross-department request code');
    }
    return `CDR${value.toString().padStart(6, '0')}`;
  }

  async nextSequenceCode(tx: Prisma.TransactionClient, sequenceName: string, prefix: string): Promise<string> {
    await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${sequenceName}" START 1`);
    const rows = await tx.$queryRawUnsafe<Array<{ nextval: bigint }>>(`SELECT nextval('${sequenceName}')`);
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error(`Cannot generate ${prefix} code`);
    }
    return `${prefix}${value.toString().padStart(6, '0')}`;
  }
}
