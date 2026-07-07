export interface WatermarkData {
    employeeName: string;
    userCode: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    companyName?: string;
}
export declare class ImageProcessingService {
    private readonly logger;
    addAttendanceWatermark(imageBuffer: Buffer, data: WatermarkData): Promise<Buffer>;
}
