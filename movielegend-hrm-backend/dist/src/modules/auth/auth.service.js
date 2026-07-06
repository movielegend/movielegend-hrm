"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    config;
    uploads;
    constructor(prisma, jwtService, config, uploads) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.uploads = uploads;
    }
    async register(dto, meta) {
        this.assertRequiredFaceImages(dto.faceImages.map((image) => image.pose));
        const faceFileIds = dto.faceImages.map((image) => image.fileId).filter((id) => Boolean(id));
        if (faceFileIds.length > 0 && faceFileIds.length !== 3) {
            throw (0, error_util_1.badRequest)('UPLOAD_FILE_REQUIRED', 'FACE_REGISTRATION requires uploaded references for all three poses');
        }
        return this.prisma.$transaction(async (tx) => {
            const [existingPhone, existingCard, department] = await Promise.all([
                tx.user.findUnique({ where: { phone: dto.phone } }),
                tx.employeeProfile.findUnique({ where: { idCardNumber: dto.idCardNumber } }),
                tx.department.findFirst({
                    where: { id: dto.requestedDepartmentId, isActive: true, deletedAt: null },
                }),
            ]);
            if (existingPhone)
                throw (0, error_util_1.conflict)('DUPLICATE_PHONE', 'Số điện thoại đã tồn tại');
            if (existingCard)
                throw (0, error_util_1.conflict)('DUPLICATE_ID_CARD', 'CCCD đã tồn tại');
            if (!department)
                throw (0, error_util_1.badRequest)('DEPARTMENT_NOT_FOUND', 'Phòng ban không tồn tại hoặc đã ngừng hoạt động');
            const passwordHash = await bcrypt.hash(dto.password, 12);
            const userCode = await this.prisma.nextUserCode(tx);
            const employeeRole = await tx.role.findUnique({ where: { code: 'EMPLOYEE' } });
            const user = await tx.user.create({
                data: {
                    userCode,
                    phone: dto.phone,
                    email: dto.email,
                    passwordHash,
                    accountStatus: client_1.AccountStatus.PENDING,
                    approvalStatus: client_1.ApprovalStatus.PENDING,
                    isActive: false,
                    profile: {
                        create: {
                            fullName: dto.fullName,
                            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                            gender: dto.gender,
                            idCardNumber: dto.idCardNumber,
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
                    faceProfile: {
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
                    },
                },
            });
            const request = await tx.userApprovalRequest.create({
                data: {
                    userId: user.id,
                    requestedDepartmentId: dto.requestedDepartmentId,
                    histories: {
                        create: {
                            action: client_1.ApprovalAction.CREATED,
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
            await this.uploads.attachTemporaryFiles(faceFileIds, user.id, client_1.UploadPurpose.FACE_REGISTRATION, tx);
            return {
                id: user.id,
                userCode: user.userCode,
                approvalRequestId: request.id,
                accountStatus: user.accountStatus,
                approvalStatus: user.approvalStatus,
            };
        });
    }
    async login(dto, meta) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
            include: this.userInclude(),
        });
        if (!user)
            throw (0, error_util_1.unauthorized)('INVALID_CREDENTIALS', 'Số điện thoại hoặc mật khẩu không đúng');
        const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordOk)
            throw (0, error_util_1.unauthorized)('INVALID_CREDENTIALS', 'Số điện thoại hoặc mật khẩu không đúng');
        if (user.approvalStatus === client_1.ApprovalStatus.PENDING) {
            throw (0, error_util_1.unauthorized)('ACCOUNT_PENDING_APPROVAL', 'Tài khoản đang chờ duyệt');
        }
        if (user.approvalStatus === client_1.ApprovalStatus.REJECTED) {
            throw (0, error_util_1.unauthorized)('ACCOUNT_REJECTED', 'Tài khoản đã bị từ chối');
        }
        if (user.accountStatus === client_1.AccountStatus.SUSPENDED) {
            throw (0, error_util_1.unauthorized)('ACCOUNT_SUSPENDED', 'Tài khoản đã bị tạm khóa');
        }
        if (!user.isActive || user.accountStatus !== client_1.AccountStatus.ACTIVE) {
            throw (0, error_util_1.unauthorized)('ACCOUNT_INACTIVE', 'Tài khoản chưa hoạt động');
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
    async refresh(dto) {
        const secret = this.config.getOrThrow('jwt.refreshSecret');
        const payload = await this.verifyRefreshToken(dto.refreshToken, secret);
        const session = await this.prisma.refreshSession.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session || session.revokedAt || session.expiresAt <= new Date()) {
            throw (0, error_util_1.unauthorized)('REFRESH_TOKEN_REVOKED', 'Refresh token không hợp lệ hoặc đã bị thu hồi');
        }
        const match = await bcrypt.compare(dto.refreshToken, session.tokenHash);
        if (!match)
            throw (0, error_util_1.unauthorized)('REFRESH_TOKEN_REVOKED', 'Refresh token không hợp lệ hoặc đã bị thu hồi');
        await this.prisma.refreshSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
        });
        return this.createTokens(session.userId, {});
    }
    async logout(dto) {
        const secret = this.config.getOrThrow('jwt.refreshSecret');
        const payload = await this.verifyRefreshToken(dto.refreshToken, secret);
        await this.prisma.refreshSession.updateMany({
            where: { id: payload.sessionId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { revoked: true };
    }
    async me(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: this.userInclude(),
        });
        return this.toAuthUser(user);
    }
    async buildPayload(userId) {
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
        const permissions = new Set();
        const roles = new Set();
        const scopes = [];
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
    async createTokens(userId, meta) {
        const payload = await this.buildPayload(userId);
        const accessSecret = this.config.getOrThrow('jwt.accessSecret');
        const refreshSecret = this.config.getOrThrow('jwt.refreshSecret');
        const accessExpiresIn = this.config.get('jwt.accessExpiresIn') ?? '15m';
        const refreshExpiresIn = this.config.get('jwt.refreshExpiresIn') ?? '30d';
        const refreshDays = this.parseRefreshDays(this.config.get('jwt.refreshExpiresIn') ?? '30d');
        const session = await this.prisma.refreshSession.create({
            data: {
                userId,
                tokenHash: 'pending',
                expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
            },
        });
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: accessSecret,
            expiresIn: accessExpiresIn,
        });
        const refreshToken = await this.jwtService.signAsync({ sub: userId, sessionId: session.id }, { secret: refreshSecret, expiresIn: refreshExpiresIn });
        await this.prisma.refreshSession.update({
            where: { id: session.id },
            data: { tokenHash: await bcrypt.hash(refreshToken, 12) },
        });
        return { accessToken, refreshToken };
    }
    assertRequiredFaceImages(poses) {
        if (new Set(poses).size !== 3) {
            throw (0, error_util_1.badRequest)('INVALID_FACE_IMAGES', 'Ảnh khuôn mặt phải gồm đúng FRONT, LEFT, RIGHT');
        }
        for (const pose of [client_1.FacePoseType.FRONT, client_1.FacePoseType.LEFT, client_1.FacePoseType.RIGHT]) {
            if (!poses.includes(pose)) {
                throw (0, error_util_1.badRequest)(`MISSING_FACE_${pose}`, `Thiếu ảnh khuôn mặt ${pose}`);
            }
        }
    }
    async verifyRefreshToken(token, secret) {
        try {
            return await this.jwtService.verifyAsync(token, { secret });
        }
        catch {
            throw (0, error_util_1.unauthorized)('REFRESH_TOKEN_INVALID', 'Refresh token không hợp lệ');
        }
    }
    parseRefreshDays(value) {
        const match = value.match(/^(\d+)d$/);
        return match ? Number(match[1]) : 30;
    }
    userInclude() {
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
        };
    }
    toAuthUser(user) {
        const permissions = new Set();
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        uploads_service_1.UploadsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map