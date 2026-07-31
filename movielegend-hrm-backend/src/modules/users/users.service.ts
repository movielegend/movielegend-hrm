import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { StorageService } from '../storage/storage.service';
import { UpdateFaceDto, UpdateMeDto } from './dto/update-me.dto';
import { FacePoseType, UploadPurpose } from '@prisma/client';
import { badRequest } from '../../common/utils/error.util';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeEventsService,
  ) { }

  async updateMe(dto: UpdateMeDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ 
        where: { id: actor.userId },
        include: { profile: true }
      });
      if (!user) throw notFound('USER_NOT_FOUND', 'Người dùng không tồn tại');

      if (dto.phone && dto.phone !== user.phone) {
        const existingPhone = await tx.user.findUnique({ where: { phone: dto.phone } });
        if (existingPhone) throw badRequest('PHONE_ALREADY_EXISTS', 'Số điện thoại này đã được sử dụng bởi tài khoản khác');
      }

      if (dto.email && dto.email !== user.email) {
        const existingEmail = await tx.user.findUnique({ where: { email: dto.email } });
        if (existingEmail) throw badRequest('EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng bởi tài khoản khác');
      }

      // Nếu có cập nhật Avatar mới và Avatar cũ tồn tại, thì trích xuất key và xóa rác
      if (dto.avatarUrl !== undefined && user.profile?.avatarUrl && dto.avatarUrl !== user.profile.avatarUrl) {
        const oldKey = this.storage.extractKeyFromUrl(user.profile.avatarUrl);
        if (oldKey) {
          await this.storage.delete(oldKey).catch(e => console.error(`Failed to delete old avatar ${oldKey}`, e));
        }
      }

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

      // Phát sự kiện realtime để app nhận biết cập nhật (nếu đang online)
      this.realtime.emitToUser(actor.userId, 'user.profile.updated', safeUser);

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
        // Delete old physical images
        const oldImages = await tx.faceRegistrationImage.findMany({ where: { faceProfileId } });
        for (const img of oldImages) {
          const oldKey = this.storage.extractKeyFromUrl(img.imageUrl);
          if (oldKey) {
            await this.storage.delete(oldKey).catch(e => console.error(`Failed to delete old face image ${oldKey}`, e));
          }
        }

        // Delete old images from DB
        await tx.faceRegistrationImage.deleteMany({
          where: { faceProfileId },
        });
        // Auto-approve when updating
        await tx.faceProfile.update({
          where: { id: faceProfileId },
          data: { status: 'APPROVED' },
        });
      } else {
        // Create new face profile and auto-approve
        const newFaceProfile = await tx.faceProfile.create({
          data: { userId: actor.userId, status: 'APPROVED' },
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
