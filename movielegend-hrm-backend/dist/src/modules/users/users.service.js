"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
const client_1 = require("@prisma/client");
const error_util_2 = require("../../common/utils/error.util");
let UsersService = class UsersService {
    prisma;
    uploads;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    async updateMe(dto, actor) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: actor.userId } });
            if (!user)
                throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Người dùng không tồn tại');
            const updatedUser = await tx.user.update({
                where: { id: actor.userId },
                data: {
                    ...(dto.phone ? { phone: dto.phone } : {}),
                    ...(dto.email ? { email: dto.email } : {}),
                    ...(dto.avatarUrl !== undefined
                        ? {
                            profile: {
                                update: { avatarUrl: dto.avatarUrl },
                            },
                        }
                        : {}),
                },
                include: { profile: true },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'user.profile.update',
                    entityType: 'User',
                    entityId: actor.userId,
                    metadata: { ...dto },
                },
            });
            const { passwordHash: _hash, ...safeUser } = updatedUser;
            return safeUser;
        });
    }
    async updateMyFace(dto, actor) {
        const requiredPoses = [client_1.FacePoseType.FRONT, client_1.FacePoseType.LEFT, client_1.FacePoseType.RIGHT];
        const providedPoses = dto.faceImages.map((img) => img.pose);
        const missingPoses = requiredPoses.filter((pose) => !providedPoses.includes(pose));
        if (missingPoses.length > 0) {
            throw (0, error_util_2.badRequest)('MISSING_FACE_IMAGES', `Thiếu ảnh khuôn mặt: ${missingPoses.join(', ')}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: actor.userId },
                include: { faceProfile: true },
            });
            if (!user)
                throw (0, error_util_1.notFound)('USER_NOT_FOUND', 'Người dùng không tồn tại');
            let faceProfileId = user.faceProfile?.id;
            if (faceProfileId) {
                await tx.faceRegistrationImage.deleteMany({
                    where: { faceProfileId },
                });
            }
            else {
                const newFaceProfile = await tx.faceProfile.create({
                    data: { userId: actor.userId },
                });
                faceProfileId = newFaceProfile.id;
            }
            await tx.faceRegistrationImage.createMany({
                data: dto.faceImages.map((img) => ({
                    faceProfileId: faceProfileId,
                    pose: img.pose,
                    imageUrl: img.imageUrl,
                })),
            });
            const fileIds = dto.faceImages.map((img) => img.fileId).filter(Boolean);
            if (fileIds.length > 0) {
                await this.uploads.attachTemporaryFiles(fileIds, actor.userId, client_1.UploadPurpose.FACE_REGISTRATION, tx);
            }
            await tx.auditLog.create({
                data: {
                    actorUserId: actor.userId,
                    action: 'user.face.update',
                    entityType: 'User',
                    entityId: actor.userId,
                    metadata: { faceProfileId },
                },
            });
            return { success: true, message: 'Cap nhat hinh anh thanh cong' };
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], UsersService);
//# sourceMappingURL=users.service.js.map