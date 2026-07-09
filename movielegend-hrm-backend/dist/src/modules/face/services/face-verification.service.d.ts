export interface AttendanceFaceVerificationInput {
    userId: string;
    image?: string;
}
export interface AttendanceFaceVerificationResult {
    matched: boolean;
    confidence?: number;
    reason?: string;
    provider?: string;
}
export declare class FaceVerificationService {
    verifyAttendanceFace(_input: AttendanceFaceVerificationInput): Promise<AttendanceFaceVerificationResult>;
}
