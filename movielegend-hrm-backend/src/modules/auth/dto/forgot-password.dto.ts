import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '0987654321', description: 'Phone number to send OTP to' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0987654321', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'some-uuid-reset-token', description: 'Token received from verify-otp' })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({ example: 'NewPass123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
