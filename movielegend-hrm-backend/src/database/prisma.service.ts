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
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async nextUserCode(tx: Prisma.TransactionClient): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('user_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Không tạo được mã nhân viên');
    }
    return `NV${value.toString().padStart(6, '0')}`;
  }

  async nextTaskCode(tx: Prisma.TransactionClient): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('task_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Cannot generate task code');
    }
    return `TASK${value.toString().padStart(6, '0')}`;
  }

  async nextCrossDepartmentRequestCode(tx: Prisma.TransactionClient): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('cross_department_request_code_seq')`;
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error('Cannot generate cross-department request code');
    }
    return `CDR${value.toString().padStart(6, '0')}`;
  }

  async nextSequenceCode(tx: Prisma.TransactionClient, sequenceName: string, prefix: string): Promise<string> {
    const rows = await tx.$queryRawUnsafe<Array<{ nextval: bigint }>>(`SELECT nextval('${sequenceName}')`);
    const value = rows[0]?.nextval;
    if (value === undefined) {
      throw new Error(`Cannot generate ${prefix} code`);
    }
    return `${prefix}${value.toString().padStart(6, '0')}`;
  }
}
