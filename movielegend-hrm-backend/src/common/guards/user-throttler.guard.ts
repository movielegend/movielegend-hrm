import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 1. Ưu tiên theo định danh người dùng đã xác thực
    if (req.user?.userId || req.user?.id) {
      return `user-${req.user.userId || req.user.id}`;
    }

    // 2. Nếu có Authorization Bearer token (mỗi phiên đăng nhập là duy nhất)
    if (req.headers?.authorization) {
      return `token-${req.headers.authorization}`;
    }

    // 3. Nếu chưa đăng nhập (VD: login/register), dùng IP thật từ proxy
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      if (forwardedIp) return forwardedIp;
    }

    return req.ip || 'unknown-client';
  }
}
