import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateFaceDto, UpdateMeDto } from './dto/update-me.dto';
import { FacePoseType, UploadPurpose } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) { }

  async updateMe(dto: UpdateMeDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: actor.userId } });
      if (!user) throw notFound('USER_NOT_FOUND', 'Người dùng không tồn tại');

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

  async updateMyFace(dto: UpdateFaceDto, actor: AuthenticatedUser) {
    const requiredPoses = [FacePoseType.FRONT, FacePoseType.LEFT, FacePoseType.RIGHT];
    const providedPoses = dto.faceImages.map((img) => img.pose);
    const missingPoses = requiredPoses.filter((pose) => !providedPoses.includes(pose));
    if (missingPoses.length > 0) {
      throw badRequest('MISSING_FACE_IMAGES', `Thiếu ảnh khuôn mặt: ${missingPoses.join(', ')}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: actor.userId },
        include: { faceProfile: true },
      });
      if (!user) throw notFound('USER_NOT_FOUND', 'Người dùng không tồn tại');

      let faceProfileId = user.faceProfile?.id;

      if (faceProfileId) {
        // Delete old images
        await tx.faceRegistrationImage.deleteMany({
          where: { faceProfileId },
        });
      } else {
        // Create new face profile
        const newFaceProfile = await tx.faceProfile.create({
          data: { userId: actor.userId },
        });
        faceProfileId = newFaceProfile.id;
      }

      // Insert new images
      await tx.faceRegistrationImage.createMany({
        data: dto.faceImages.map((img) => ({
          faceProfileId: faceProfileId!,
          pose: img.pose,
          imageUrl: img.imageUrl,
        })),
      });

      // Attach file ids if they are passed
      const fileIds = dto.faceImages.map((img) => img.fileId).filter(Boolean) as string[];
      if (fileIds.length > 0) {
        await this.uploads.attachTemporaryFiles(fileIds, actor.userId, UploadPurpose.FACE_REGISTRATION, tx);
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
}
