import { Injectable } from '@nestjs/common';

@Injectable()
export class BusinessTimeService {
  readonly timeZone = 'Asia/Ho_Chi_Minh';

  startOfBusinessDate(value: string | Date): Date {
    if (typeof value === 'string') {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0));
    }
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
  }

  businessDateString(value: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }

  addDays(value: Date, days: number): Date {
    return new Date(value.getTime() + days * 86_400_000);
  }

  inclusiveDateRange(fromDate?: string, toDate?: string): { gte?: Date; lte?: Date } | undefined {
    if (!fromDate && !toDate) return undefined;
    return {
      ...(fromDate ? { gte: this.startOfBusinessDate(fromDate) } : {}),
      ...(toDate ? { lte: this.startOfBusinessDate(toDate) } : {}),
    };
  }

  inclusiveDays(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }
}
