import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UploadPurpose, UploadedFileStatus } from '@prisma/client';
import { Readable } from 'stream';
import { Request } from 'express';
import { UploadsService } from './uploads.service';
import { StorageService, UploadInput, UploadResult } from '../storage/storage.service';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe('UploadsService', () => {
  function setup() {
    const storage: jest.Mocked<StorageService> = {
      upload: jest.fn(async (input: UploadInput): Promise<UploadResult> => ({
        storageKey: input.storageKey ?? 'fallback',
        fileUrl: `/uploads/${input.storageKey ?? 'fallback'}`,
      })),
      delete: jest.fn(async () => undefined),
      exists: jest.fn(async () => true),
      getPublicUrl: jest.fn((key: string) => `/uploads/${key}`),
    };
    const prisma = {
      uploadedFile: {
        create: jest.fn(async ({ data }) => ({
          id: 'file-1',
          fileUrl: data.fileUrl,
          mimeType: data.mimeType,
          size: data.size,
          purpose: data.purpose,
          fileName: data.fileName,
          storageKey: data.storageKey,
        })),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };
    return { service: new UploadsService(prisma as never, storage), prisma, storage };
  }

  it('accepts a valid public face registration image upload', async () => {
    const { service, prisma } = setup();
    await expect(service.uploadFromRequest(multipartRequest('FACE_REGISTRATION', 'face.jpg', 'image/jpeg', jpeg))).resolves.toMatchObject({
      fileId: 'file-1',
      mimeType: 'image/jpeg',
      purpose: UploadPurpose.FACE_REGISTRATION,
    });
    expect(prisma.uploadedFile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ checksum: expect.any(String) }),
    }));
  });

  it('denies invalid MIME types', async () => {
    const { service } = setup();
    await expect(service.uploadFromRequest(multipartRequest('FACE_REGISTRATION', 'face.txt', 'text/plain', Buffer.from('text')))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies oversized files before storage writes', async () => {
    const { service, storage } = setup();
    const tooLarge = Buffer.concat([jpeg, Buffer.alloc(3 * 1024 * 1024 + 1)]);
    await expect(service.uploadFromRequest(multipartRequest('FACE_REGISTRATION', 'face.jpg', 'image/jpeg', tooLarge))).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('denies executable content disguised as an image', async () => {
    const { service } = setup();
    await expect(service.uploadFromRequest(multipartRequest('FACE_REGISTRATION', 'face.jpg', 'image/jpeg', Buffer.from('MZ executable')))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('denies unauthenticated non-registration uploads', async () => {
    const { service } = setup();
    await expect(service.uploadFromRequest(multipartRequest('TASK_ATTACHMENT', 'task.pdf', 'application/pdf', Buffer.from('%PDF-1.7')))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sanitizes path traversal filenames and stores random keys', async () => {
    const { service, prisma } = setup();
    await service.uploadFromRequest(multipartRequest('FACE_REGISTRATION', '../face.jpg', 'image/jpeg', jpeg));
    expect(prisma.uploadedFile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        fileName: 'face.jpg',
        storageKey: expect.not.stringContaining('..'),
      }),
    }));
  });

  it('prevents attaching a temporary upload owned by another user', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findMany.mockResolvedValue([{ id: 'file-1', purpose: UploadPurpose.FACE_REGISTRATION, status: UploadedFileStatus.TEMPORARY, uploadedById: 'other-user', deletedAt: null }]);
    await expect(service.attachTemporaryFiles(['file-1'], 'user-1', UploadPurpose.FACE_REGISTRATION)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents hijacking already attached uploads', async () => {
    const { service, prisma } = setup();
    prisma.uploadedFile.findMany.mockResolvedValue([{ id: 'file-1', purpose: UploadPurpose.FACE_REGISTRATION, status: UploadedFileStatus.ATTACHED, uploadedById: 'user-1', deletedAt: null }]);
    await expect(service.attachTemporaryFiles(['file-1'], 'user-1', UploadPurpose.FACE_REGISTRATION)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cleans up only expired temporary upload files', async () => {
    const { service, prisma, storage } = setup();
    prisma.uploadedFile.findMany.mockResolvedValue([{ id: 'file-1', storageKey: 'face/file.jpg' }]);
    prisma.uploadedFile.update.mockResolvedValue({});
    await expect(service.cleanupExpiredTemporaryFiles(new Date('2026-07-05T00:00:00.000Z'))).resolves.toEqual({ deleted: 1 });
    expect(storage.delete).toHaveBeenCalledWith('face/file.jpg');
    expect(prisma.uploadedFile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: UploadedFileStatus.DELETED, deletedAt: expect.any(Date) }),
    }));
  });
});

function multipartRequest(purpose: string, fileName: string, mimeType: string, file: Buffer): Request {
  const boundary = 'movielegend-boundary';
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\n${purpose}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    file,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return Object.assign(Readable.from([body]), {
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.length),
    },
  }) as unknown as Request;
}
