import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { JwtSignOptions } from '@nestjs/jwt';
import {
  AccountStatus,
  ApprovalAction,
  ApprovalStatus,
  FacePoseType,
  Prisma,
  UploadPurpose,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, conflict, unauthorized } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto, RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { HttpSmsService } from '../notifications/httpsms.service';
import { randomUUID, randomInt, createHash } from 'crypto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

interface TokenPayload extends AuthenticatedUser {}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly uploads: UploadsService,
    private readonly notifications: NotificationsService,
    private readonly httpSms: HttpSmsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldOtpTokens() {
    this.logger.log('Starting automated cleanup of OTP tokens older than 7 days...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.prisma.otpToken.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });
      this.logger.log(`Successfully deleted ${result.count} old OTP tokens.`);
    } catch (error) {
      this.logger.error('Failed to cleanup old OTP tokens', error);
    }
  }

  async register(dto: RegisterDto, meta: RequestMeta) {
    let faceFileIds: string[] = [];
    if (dto.faceImages && dto.faceImages.length > 0) {
      this.assertRequiredFaceImages(dto.faceImages.map((image) => image.pose));
      faceFileIds = dto.faceImages.map((image) => image.fileId).filter((id): id is string => Boolean(id));
      if (faceFileIds.length > 0 && faceFileIds.length !== 3) {
        throw badRequest('UPLOAD_FILE_REQUIRED', 'FACE_REGISTRATION requires uploaded references for all three poses');
      }
    }

    const idCardFileIds = [dto.idCardFrontFileId, dto.idCardBackFileId].filter((id): id is string => Boolean(id));

    return this.prisma.$transaction(async (tx) => {
      const [existingPhone, existingEmail, existingCard, department] = await Promise.all([
        tx.user.findUnique({ where: { phone: dto.phone } }),
        dto.email ? tx.user.findUnique({ where: { email: dto.email } }) : null,
        dto.idCardNumber ? tx.employeeProfile.findUnique({ where: { idCardNumber: dto.idCardNumber } }) : null,
        dto.requestedDepartmentId
          ? tx.department.findFirst({
              where: { id: dto.requestedDepartmentId, isActive: true, deletedAt: null },
            })
          : null,
      ]);

      if (existingPhone) throw conflict('DUPLICATE_PHONE', 'Số điện thoại đã tồn tại');
      if (existingEmail) throw conflict('DUPLICATE_EMAIL', 'Email đã tồn tại');
      if (existingCard) throw conflict('DUPLICATE_ID_CARD', 'CCCD đã tồn tại');
      if (!department) throw badRequest('DEPARTMENT_NOT_FOUND', 'Phòng ban không tồn tại hoặc đã ngừng hoạt động');

      let idCardFrontUrl: string | undefined;
      let idCardBackUrl: string | undefined;

      if (dto.idCardFrontFileId) {
        const frontFile = await tx.uploadedFile.findUnique({ where: { id: dto.idCardFrontFileId } });
        if (frontFile) idCardFrontUrl = frontFile.fileUrl;
      }
      if (dto.idCardBackFileId) {
        const backFile = await tx.uploadedFile.findUnique({ where: { id: dto.idCardBackFileId } });
        if (backFile) idCardBackUrl = backFile.fileUrl;
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const userCode = await this.prisma.nextUserCode(tx);
      const employeeRole = await tx.role.findUnique({ where: { code: 'EMPLOYEE' } });

      const user = await tx.user.create({
        data: {
          userCode,
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          accountStatus: AccountStatus.PENDING,
          approvalStatus: ApprovalStatus.PENDING,
          isActive: false,
          profile: {
            create: {
              fullName: dto.fullName,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
              gender: dto.gender,
              idCardNumber: dto.idCardNumber,
              idCardFrontUrl,
              idCardBackUrl,
              avatarUrl: dto.avatarUrl,
            },
          },
          roles: employeeRole
            ? {
                create: {
                  roleId: employeeRole.id,
                },
              }
            : undefined,
          faceProfile: (dto.faceImages && dto.faceImages.length > 0) ? {
            create: {
              images: {
                createMany: {
                  data: dto.faceImages.map((image) => ({
                    pose: image.pose,
                    imageUrl: image.imageUrl,
                  })),
                },
              },
            },
          } : undefined,
        },
      });

      const request = await tx.userApprovalRequest.create({
        data: {
          userId: user.id,
          requestedDepartmentId: dto.requestedDepartmentId,
          histories: {
            create: {
              action: ApprovalAction.CREATED,
              note: 'Người dùng đăng ký tài khoản',
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'auth.register',
          entityType: 'UserApprovalRequest',
          entityId: request.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          metadata: { userId: user.id },
        },
      });

      await this.uploads.attachTemporaryFiles(faceFileIds, user.id, UploadPurpose.FACE_REGISTRATION, tx);
      await this.uploads.attachTemporaryFiles(idCardFileIds, user.id, UploadPurpose.EMPLOYEE_DOCUMENT, tx);

      const admins = await tx.userRole.findMany({
        where: { role: { code: 'ADMIN' } },
        select: { userId: true }
      });

      const notifyUserIds = new Set(admins.map(a => a.userId));

      if (dto.requestedDepartmentId) {
        const leaders = await tx.userRole.findMany({
          where: { 
            role: { code: 'LEADER' },
            scopeType: 'DEPARTMENT',
            scopeId: dto.requestedDepartmentId
          },
          select: { userId: true }
        });
        leaders.forEach(l => notifyUserIds.add(l.userId));
      }

      if (notifyUserIds.size > 0) {
        await this.notifications.createForUsers(tx, Array.from(notifyUserIds), {
          type: 'ACCOUNT_APPROVAL_REQUESTED',
          title: 'Yêu cầu đăng ký tài khoản mới',
          body: `Nhân viên ${dto.fullName} (SĐT: ${dto.phone}) vừa gửi yêu cầu tạo tài khoản mới. Vui lòng kiểm tra và xét duyệt.`,
          metadata: { approvalRequestId: request.id },
        });
      }

      return {
        id: user.id,
        userCode: user.userCode,
        approvalRequestId: request.id,
        accountStatus: user.accountStatus,
        approvalStatus: user.approvalStatus,
      };
    });
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: this.userInclude(),
    });
    if (!user) throw unauthorized('INVALID_CREDENTIALS', 'Số điện thoại hoặc mật khẩu không đúng');

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) throw unauthorized('INVALID_CREDENTIALS', 'Số điện thoại hoặc mật khẩu không đúng');
    if (user.approvalStatus === ApprovalStatus.PENDING) {
      throw unauthorized('ACCOUNT_PENDING_APPROVAL', 'Tài khoản đang chờ duyệt');
    }
    if (user.approvalStatus === ApprovalStatus.REJECTED) {
      throw unauthorized('ACCOUNT_REJECTED', 'Tài khoản đã bị từ chối');
    }
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw unauthorized('ACCOUNT_SUSPENDED', 'Tài khoản đã bị tạm khóa');
    }
    if (!user.isActive || user.accountStatus !== AccountStatus.ACTIVE) {
      throw unauthorized('ACCOUNT_INACTIVE', 'Tài khoản chưa hoạt động');
    }

    const tokens = await this.createTokens(user.id, meta);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async refresh(dto: RefreshDto) {
    const secret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const payload = await this.verifyRefreshToken(dto.refreshToken, secret);
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw unauthorized('REFRESH_TOKEN_REVOKED', 'Refresh token không hợp lệ hoặc đã bị thu hồi');
    }
    const match = await bcrypt.compare(dto.refreshToken, session.tokenHash);
    if (!match) throw unauthorized('REFRESH_TOKEN_REVOKED', 'Refresh token không hợp lệ hoặc đã bị thu hồi');

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.createTokens(session.userId, {});
  }

  async logout(dto: LogoutDto) {
    const secret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const payload = await this.verifyRefreshToken(dto.refreshToken, secret);
    await this.prisma.refreshSession.updateMany({
      where: { id: payload.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Revoke device tokens so they don't receive push notifications after logout
    await this.prisma.deviceToken.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });
    if (!user) throw unauthorized('USER_NOT_FOUND', 'Người dùng không tồn tại');
    return this.toAuthUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw unauthorized('USER_NOT_FOUND', 'Người dùng không tồn tại');

    const match = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!match) {
      throw badRequest('INVALID_PASSWORD', 'Mật khẩu cũ không chính xác');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'auth.password.change',
        entityType: 'User',
        entityId: userId,
      },
    });
    return { success: true };
  }

  async buildPayload(userId: string): Promise<TokenPayload> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    const permissions = new Set<string>();
    const roles = new Set<string>();
    const scopes: TokenPayload['scopes'] = [];
    for (const userRole of user.roles) {
      roles.add(userRole.role.code);
      scopes.push({
        role: userRole.role.code,
        scopeType: userRole.scopeType,
        scopeId: userRole.scopeId,
      });
      userRole.role.permissions.forEach((item) => permissions.add(item.permission.code));
    }
    return {
      sub: user.id,
      userId: user.id,
      roles: [...roles],
      permissions: [...permissions],
      scopes,
    };
  }

  private async createTokens(userId: string, meta: RequestMeta) {
    const payload = await this.buildPayload(userId);
    const accessSecret = this.config.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn') ?? '15m';
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '30d';
    const refreshDays = this.parseRefreshDays(this.config.get<string>('jwt.refreshExpiresIn') ?? '30d');
    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: 'pending_' + Date.now() + '_' + Math.random().toString(36).substring(2),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, sessionId: session.id },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'] },
    );
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { tokenHash: await bcrypt.hash(refreshToken, 12) },
    });
    return { accessToken, refreshToken };
  }

  private assertRequiredFaceImages(poses: FacePoseType[]): void {
    if (new Set(poses).size !== 3) {
      throw badRequest('INVALID_FACE_IMAGES', 'Ảnh khuôn mặt phải gồm đúng FRONT, LEFT, RIGHT');
    }
    for (const pose of [FacePoseType.FRONT, FacePoseType.LEFT, FacePoseType.RIGHT]) {
      if (!poses.includes(pose)) {
        throw badRequest(`MISSING_FACE_${pose}`, `Thiếu ảnh khuôn mặt ${pose}`);
      }
    }
  }

  private async verifyRefreshToken(token: string, secret: string): Promise<{ sub: string; sessionId: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; sessionId: string }>(token, { secret });
    } catch {
      throw unauthorized('REFRESH_TOKEN_INVALID', 'Refresh token không hợp lệ');
    }
  }

  private parseRefreshDays(value: string): number {
    const match = value.match(/^(\d+)d$/);
    return match ? Number(match[1]) : 30;
  }

  private userInclude() {
    return {
      profile: { include: { position: true } },
      faceProfile: { include: { images: true } },
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      departmentLinks: {
        where: { leftAt: null, isPrimary: true },
        include: { department: true, position: true },
      },
    } satisfies Prisma.UserInclude;
  }

  private toAuthUser(user: Prisma.UserGetPayload<{ include: ReturnType<AuthService['userInclude']> }>) {
    const permissions = new Set<string>();
    const roles = user.roles.map((userRole) => {
      userRole.role.permissions.forEach((item) => permissions.add(item.permission.code));
      return userRole.role.code;
    });
    const primaryDepartment = user.departmentLinks[0];
    return {
      id: user.id,
      userCode: user.userCode,
      fullName: user.profile?.fullName ?? '',
      phone: user.phone,
      email: user.email,
      avatarUrl: user.profile?.avatarUrl,
      roles,
      permissions: [...permissions],
      department: primaryDepartment?.department ?? null,
      position: user.profile?.position ?? primaryDepartment?.position ?? null,
      hasFaceData: Boolean(user.faceProfile?.images.length),
      accountStatus: user.accountStatus,
      approvalStatus: user.approvalStatus,
      isActive: user.isActive,
    };
  }

  async requestOtp(dto: RequestOtpDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    // Check rate limits: 3 reqs / 15 mins, 5 reqs / 1 hr for this phone.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const oneMinAgo = new Date(Date.now() - 60 * 1000);

    const recentRequests = await this.prisma.otpToken.findMany({
      where: { phone: dto.phone, createdAt: { gte: oneHourAgo } },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequests.length >= 5) {
      throw badRequest('RATE_LIMIT_EXCEEDED', 'Bạn đã yêu cầu quá số lần cho phép trong 1 giờ. Vui lòng thử lại sau.');
    }
    const recent15Mins = recentRequests.filter((r) => r.createdAt >= fifteenMinsAgo);
    if (recent15Mins.length >= 3) {
      throw badRequest('RATE_LIMIT_EXCEEDED', 'Bạn đã yêu cầu quá số lần cho phép trong 15 phút. Vui lòng thử lại sau.');
    }
    if (recentRequests.length > 0 && recentRequests[0].createdAt >= oneMinAgo) {
      throw badRequest('RATE_LIMIT_EXCEEDED', 'Vui lòng đợi 60 giây trước khi yêu cầu lại.');
    }

    if (!user) {
      // Simulate bcrypt delay and network delay to prevent timing attacks
      await bcrypt.hash('dummy_otp', 12);
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Nếu số điện thoại này được đăng ký trong hệ thống, mã OTP sẽ được gửi tới số điện thoại đó.' };
    }

    // Invalidate old OTPs and reset tokens for this phone
    await this.prisma.otpToken.updateMany({
      where: { 
        phone: dto.phone, 
        OR: [
          { isUsed: false, expiresAt: { gt: new Date() } },
          { resetExpireAt: { gt: new Date() } }
        ]
      },
      data: { isUsed: true, resetToken: null, resetExpireAt: null },
    });

    const otpCode = randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otpCode, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpToken.create({
      data: {
        userId: user.id,
        phone: dto.phone,
        otpHash,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    // Send SMS via HttpSmsService
    const smsContent = `[MovieLegend HRM] Ma xac thuc cua ban la: ${otpCode}. Ma co hieu luc trong 5 phut. Khong chia se ma nay cho bat ky ai.`;
    const smsSuccess = await this.httpSms.sendSms(dto.phone, smsContent);
    
    if (!smsSuccess) {
      // Do not throw error to client to prevent account enumeration. Log internally instead.
      this.logger.error(`Failed to send SMS to ${dto.phone} but returning generic success response.`);
    }

    return { message: 'Nếu số điện thoại này được đăng ký trong hệ thống, mã OTP sẽ được gửi tới số điện thoại đó.' };
  }

  async verifyOtp(dto: VerifyOtpDto, meta: RequestMeta) {
    const otpToken = await this.prisma.otpToken.findFirst({
      where: { phone: dto.phone, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpToken) {
      throw badRequest('INVALID_OTP', 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    }
    if (otpToken.attempts >= 5) {
      await this.prisma.otpToken.update({ where: { id: otpToken.id }, data: { isUsed: true } });
      throw badRequest('INVALID_OTP', 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.');
    }

    const isValid = await bcrypt.compare(dto.otp, otpToken.otpHash);
    if (!isValid) {
      await this.prisma.otpToken.update({
        where: { id: otpToken.id },
        data: { attempts: { increment: 1 } },
      });
      throw badRequest('INVALID_OTP', 'Mã xác thực không hợp lệ.');
    }

    // OTP is valid. Issue reset token.
    const resetToken = randomUUID();
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { isUsed: true, resetToken: resetTokenHash, resetExpireAt },
    });

    return { resetToken, message: 'Xác minh thành công. Vui lòng đặt lại mật khẩu.' };
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    if (dto.newPassword.length < 6) {
      throw badRequest('INVALID_PASSWORD', 'Mật khẩu phải có ít nhất 6 ký tự.');
    }
    const resetTokenHash = createHash('sha256').update(dto.resetToken).digest('hex');

    const otpToken = await this.prisma.otpToken.findUnique({
      where: { resetToken: resetTokenHash },
    });

    if (!otpToken || !otpToken.resetExpireAt || otpToken.resetExpireAt < new Date()) {
      throw badRequest('INVALID_TOKEN', 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      // ATOMIC CLAIM: Try to set resetToken to null ONLY IF it is still resetTokenHash
      const updatedToken = await tx.otpToken.updateMany({
        where: { id: otpToken.id, resetToken: resetTokenHash },
        data: { resetToken: null, resetExpireAt: null },
      });

      if (updatedToken.count === 0) {
        throw badRequest('INVALID_TOKEN', 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.');
      }

      await tx.user.update({
        where: { id: otpToken.userId },
        data: { passwordHash },
      });
      
      // Revoke all refresh sessions
      await tx.refreshSession.deleteMany({
        where: { userId: otpToken.userId },
      });
    });

    return { message: 'Đặt lại mật khẩu thành công.' };
  }
}
