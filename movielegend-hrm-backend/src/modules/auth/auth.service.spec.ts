import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuthService } from './auth.service';

describe('AuthService login', () => {
  const createService = (user: Record<string, unknown> | null) => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
      refreshSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
        update: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
    } as unknown as PrismaService;
    const jwt = {
      signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
      verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
    } as unknown as JwtService;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'jwt.accessExpiresIn': '15m',
          'jwt.refreshExpiresIn': '30d',
        };
        return values[key];
      }),
      getOrThrow: jest.fn((key: string) => `${key}-secret`),
    } as unknown as ConfigService;
    const uploads = {
      attachTemporaryFiles: jest.fn().mockResolvedValue(undefined),
    } as unknown as UploadsService;
    const notifications = {
      createForUsers: jest.fn().mockResolvedValue(undefined),
    } as any;
    return { service: new AuthService(prisma, jwt, config, uploads, notifications) };
  };

  it('denies pending users', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    const { service } = createService({
      id: 'user-1',
      passwordHash,
      approvalStatus: ApprovalStatus.PENDING,
      accountStatus: AccountStatus.PENDING,
      isActive: false,
    });
    await expect(service.login({ phone: '0900000000', password: 'password123' }, {})).rejects.toMatchObject({
      response: { code: 'ACCOUNT_PENDING_APPROVAL' },
    });
  });

  it('returns tokens and sanitized user for active users', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    const { service } = createService({
      id: 'user-1',
      userCode: 'NV000001',
      phone: '0900000000',
      email: null,
      passwordHash,
      approvalStatus: ApprovalStatus.APPROVED,
      accountStatus: AccountStatus.ACTIVE,
      isActive: true,
      profile: { fullName: 'Nguyen Van A', avatarUrl: null, position: null },
      faceProfile: { images: [{ id: 'face-image' }] },
      roles: [{ role: { code: 'EMPLOYEE', permissions: [{ permission: { code: 'employee.read' } }] } }],
      departmentLinks: [],
    });
    const result = await service.login({ phone: '0900000000', password: 'password123' }, {});
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.roles).toEqual(['EMPLOYEE']);
  });

  it('maps invalid refresh tokens to a business error', async () => {
    const { service } = createService(null);
    await expect(service.refresh({ refreshToken: 'bad-token' })).rejects.toMatchObject({
      response: { code: 'REFRESH_TOKEN_INVALID' },
    });
  });
});
