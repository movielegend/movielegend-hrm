import { DevicePlatform } from '@prisma/client';
export declare class RegisterDeviceTokenDto {
    token: string;
    platform: DevicePlatform;
    deviceId?: string;
}
