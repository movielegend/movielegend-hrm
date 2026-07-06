export declare class BusinessTimeService {
    readonly timeZone = "Asia/Ho_Chi_Minh";
    startOfBusinessDate(value: string | Date): Date;
    businessDateString(value?: Date): string;
    addDays(value: Date, days: number): Date;
    inclusiveDateRange(fromDate?: string, toDate?: string): {
        gte?: Date;
        lte?: Date;
    } | undefined;
    inclusiveDays(start: Date, end: Date): number;
}
