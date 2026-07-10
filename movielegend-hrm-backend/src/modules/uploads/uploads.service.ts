import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, UploadPurpose, UploadedFileStatus } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import { Request } from 'express';
import * as path from 'path';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { badRequest, forbidden, notFound } from '../../common/utils/error.util';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { maxUploadSize, uploadPolicies } from './upload-policy';

interface ParsedFile {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

interface ParsedMultipart {
  purpose?: string;
  file?: ParsedFile;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadFromRequest(request: Request, actor?: AuthenticatedUser) {
    const parsed = await parseMultipartRequest(request);
    if (!parsed.file) throw badRequest('UPLOAD_FILE_REQUIRED', 'File is required');
    const purpose = parsePurpose(parsed.purpose);
    if (!actor && purpose !== UploadPurpose.FACE_REGISTRATION) {
      throw forbidden('UPLOAD_UNAUTHORIZED', 'Authentication is required for this upload purpose');
    }

    const policy = uploadPolicies[purpose];
    validateFile(parsed.file, policy);

    const extension = extensionFor(parsed.file.fileName, parsed.file.mimeType);
    const storageKey = `${purpose.toLowerCase()}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    const checksum = createHash('sha256').update(parsed.file.buffer).digest('hex');
    const stored = await this.storage
      .upload({
        buffer: parsed.file.buffer,
        fileName: parsed.file.fileName,
        mimeType: parsed.file.mimeType,
        storageKey,
      })
      .catch(() => {
        throw new InternalServerErrorException({ code: 'UPLOAD_STORAGE_FAILED', message: 'Storage failed' });
      });

    try {
      const record = await this.prisma.uploadedFile.create({
        data: {
          uploadedById: actor?.userId,
          purpose,
          fileName: safeOriginalName(parsed.file.fileName),
          storageKey: stored.storageKey,
          fileUrl: stored.fileUrl,
          mimeType: parsed.file.mimeType,
          size: parsed.file.buffer.length,
          checksum,
        },
      });
      return toDto(record);
    } catch (error) {
      await this.storage.delete(stored.storageKey);
      throw error;
    }
  }

  async attachTemporaryFiles(
    fileIds: string[],
    ownerUserId: string,
    purpose: UploadPurpose,
    tx?: Prisma.TransactionClient,
  ) {
    if (!fileIds.length) return;
    const client = tx ?? this.prisma;
    const files = await client.uploadedFile.findMany({ where: { id: { in: fileIds } } });
    if (files.length !== fileIds.length) throw notFound('UPLOAD_NOT_FOUND', 'Uploaded file not found');
    for (const file of files) {
      if (file.purpose !== purpose || file.deletedAt) {
        throw notFound('UPLOAD_NOT_FOUND', 'Uploaded file not found');
      }
      if (file.status === UploadedFileStatus.ATTACHED) {
        throw badRequest('UPLOAD_ALREADY_ATTACHED', 'Uploaded file is already attached');
      }
      if (file.status !== UploadedFileStatus.TEMPORARY) {
        throw badRequest('UPLOAD_NOT_FOUND', 'Uploaded file is not available');
      }
      if (file.uploadedById && file.uploadedById !== ownerUserId) {
        throw forbidden('UPLOAD_UNAUTHORIZED', 'Uploaded file belongs to another user');
      }
    }
    await client.uploadedFile.updateMany({
      where: { id: { in: fileIds }, status: UploadedFileStatus.TEMPORARY },
      data: { status: UploadedFileStatus.ATTACHED, uploadedById: ownerUserId },
    });
  }

  async cleanupExpiredTemporaryFiles(olderThan: Date) {
    const files = await this.prisma.uploadedFile.findMany({
      where: {
        status: UploadedFileStatus.TEMPORARY,
        createdAt: { lt: olderThan },
        deletedAt: null,
      },
    });
    for (const file of files) {
      await this.storage.delete(file.storageKey);
      await this.prisma.uploadedFile.update({
        where: { id: file.id },
        data: { status: UploadedFileStatus.DELETED, deletedAt: new Date() },
      });
    }
    return { deleted: files.length };
  }
}

function toDto(file: {
  id: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
}) {
  return {
    fileId: file.id,
    fileUrl: file.fileUrl,
    mimeType: file.mimeType,
    size: file.size,
    purpose: file.purpose,
  };
}

function parsePurpose(value?: string): UploadPurpose {
  if (!value || !(value in UploadPurpose)) {
    throw badRequest('UPLOAD_PURPOSE_INVALID', 'Upload purpose is invalid');
  }
  return UploadPurpose[value as keyof typeof UploadPurpose];
}

function validateFile(file: ParsedFile, policy: (typeof uploadPolicies)[UploadPurpose]) {
  if (file.buffer.length > policy.maxSize) {
    throw badRequest('UPLOAD_FILE_TOO_LARGE', 'File is too large');
  }
  if (!policy.mimeTypes.includes(file.mimeType)) {
    throw badRequest('UPLOAD_MIME_NOT_ALLOWED', 'MIME type is not allowed');
  }
  const extension = path.extname(file.fileName).toLowerCase();
  if (!extension || !policy.extensions.includes(extension)) {
    throw badRequest('UPLOAD_MIME_NOT_ALLOWED', 'File extension is not allowed');
  }
  if (!signatureMatches(file.buffer, file.mimeType)) {
    throw badRequest('UPLOAD_SIGNATURE_INVALID', 'File signature does not match MIME type');
  }
}

function signatureMatches(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType.includes('officedocument')) return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  return false;
}

function extensionFor(fileName: string, mimeType: string): string {
  const extension = path.extname(fileName).toLowerCase();
  if (extension) return extension;
  const fallback: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return fallback[mimeType] ?? '.bin';
}

function safeOriginalName(fileName: string): string {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

async function parseMultipartRequest(request: Request): Promise<ParsedMultipart> {
  const contentType = request.headers['content-type'] ?? '';
  const boundaryMatch = /boundary=([^;]+)/i.exec(Array.isArray(contentType) ? contentType[0] : contentType);
  if (!boundaryMatch) throw badRequest('BAD_REQUEST', 'multipart boundary is required');
  const contentLength = Number(request.headers['content-length'] ?? 0);
  if (contentLength > maxUploadSize + 4096) throw badRequest('UPLOAD_FILE_TOO_LARGE', 'File is too large');

  const body = await readRequestBody(request, maxUploadSize + 4096);
  const parts = splitMultipart(body, boundaryMatch[1]);
  const parsed: ParsedMultipart = {};
  let fileCount = 0;

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd < 0) continue;
    const rawHeaders = part.subarray(0, headerEnd).toString('utf8');
    const content = trimTrailingCrlf(part.subarray(headerEnd + 4));
    const disposition = /content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i.exec(rawHeaders);
    if (!disposition) continue;
    const name = disposition[1];
    if (name !== 'file' && name !== 'purpose') throw badRequest('BAD_REQUEST', 'Unexpected multipart field');
    if (/[.[\]]/.test(name)) throw badRequest('BAD_REQUEST', 'Nested multipart fields are not allowed');
    if (name === 'purpose') {
      parsed.purpose = content.toString('utf8').trim();
      continue;
    }
    fileCount += 1;
    if (fileCount > 1) throw badRequest('BAD_REQUEST', 'Only one file is allowed');
    const contentTypeHeader = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders);
    parsed.file = {
      fileName: disposition[2] ? path.basename(disposition[2]) : 'upload.bin',
      mimeType: contentTypeHeader?.[1]?.trim().toLowerCase() ?? 'application/octet-stream',
      buffer: content,
    };
  }
  return parsed;
}

async function readRequestBody(request: Request, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw badRequest('UPLOAD_FILE_TOO_LARGE', 'File is too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function splitMultipart(body: Buffer, boundaryValue: string): Buffer[] {
  const boundary = Buffer.from(`--${boundaryValue}`);
  const parts: Buffer[] = [];
  let cursor = body.indexOf(boundary);
  while (cursor >= 0) {
    const next = body.indexOf(boundary, cursor + boundary.length);
    if (next < 0) break;
    let part = body.subarray(cursor + boundary.length, next);
    if (part.subarray(0, 2).toString('ascii') === '\r\n') part = part.subarray(2);
    if (part.subarray(0, 2).toString('ascii') !== '--') parts.push(part);
    cursor = next;
  }
  return parts;
}

function trimTrailingCrlf(buffer: Buffer): Buffer {
  if (buffer.length >= 2 && buffer.subarray(buffer.length - 2).toString('ascii') === '\r\n') {
    return buffer.subarray(0, buffer.length - 2);
  }
  return buffer;
}
