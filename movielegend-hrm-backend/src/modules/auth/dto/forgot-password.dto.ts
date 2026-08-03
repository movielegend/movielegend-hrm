import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class RequestOtpDto {
  @ApiPropertyOptional({ example: '0987654321', description: 'Phone number to send OTP to' })
  @ValidateIf(o => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address to send OTP to' })
  @ValidateIf(o => !o.phone)
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '0987654321', description: 'Phone number' })
  @ValidateIf(o => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address' })
  @ValidateIf(o => !o.phone)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

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
