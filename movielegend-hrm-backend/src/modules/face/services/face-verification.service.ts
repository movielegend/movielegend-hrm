import { Injectable } from '@nestjs/common';

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

@Injectable()
export class FaceVerificationService {
  async verifyAttendanceFace(
    _input: AttendanceFaceVerificationInput,
  ): Promise<AttendanceFaceVerificationResult> {
    return {
      matched: true,
      confidence: undefined,
      provider: 'not_configured',
      reason: 'Face verification provider is not configured in Phase 2',
    };
  }
}
