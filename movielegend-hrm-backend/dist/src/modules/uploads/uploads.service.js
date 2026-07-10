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
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const path = __importStar(require("path"));
const error_util_1 = require("../../common/utils/error.util");
const prisma_service_1 = require("../../database/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const upload_policy_1 = require("./upload-policy");
let UploadsService = class UploadsService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async uploadFromRequest(request, actor) {
        const parsed = await parseMultipartRequest(request);
        if (!parsed.file)
            throw (0, error_util_1.badRequest)('UPLOAD_FILE_REQUIRED', 'File is required');
        const purpose = parsePurpose(parsed.purpose);
        if (!actor && purpose !== client_1.UploadPurpose.FACE_REGISTRATION) {
            throw (0, error_util_1.forbidden)('UPLOAD_UNAUTHORIZED', 'Authentication is required for this upload purpose');
        }
        const policy = upload_policy_1.uploadPolicies[purpose];
        validateFile(parsed.file, policy);
        const extension = extensionFor(parsed.file.fileName, parsed.file.mimeType);
        const storageKey = `${purpose.toLowerCase()}/${new Date().toISOString().slice(0, 10)}/${(0, crypto_1.randomUUID)()}${extension}`;
        const checksum = (0, crypto_1.createHash)('sha256').update(parsed.file.buffer).digest('hex');
        const stored = await this.storage
            .upload({
            buffer: parsed.file.buffer,
            fileName: parsed.file.fileName,
            mimeType: parsed.file.mimeType,
            storageKey,
        })
            .catch(() => {
            throw new common_1.InternalServerErrorException({ code: 'UPLOAD_STORAGE_FAILED', message: 'Storage failed' });
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
        }
        catch (error) {
            await this.storage.delete(stored.storageKey);
            throw error;
        }
    }
    async attachTemporaryFiles(fileIds, ownerUserId, purpose, tx) {
        if (!fileIds.length)
            return;
        const client = tx ?? this.prisma;
        const files = await client.uploadedFile.findMany({ where: { id: { in: fileIds } } });
        if (files.length !== fileIds.length)
            throw (0, error_util_1.notFound)('UPLOAD_NOT_FOUND', 'Uploaded file not found');
        for (const file of files) {
            if (file.purpose !== purpose || file.deletedAt) {
                throw (0, error_util_1.notFound)('UPLOAD_NOT_FOUND', 'Uploaded file not found');
            }
            if (file.status === client_1.UploadedFileStatus.ATTACHED) {
                throw (0, error_util_1.badRequest)('UPLOAD_ALREADY_ATTACHED', 'Uploaded file is already attached');
            }
            if (file.status !== client_1.UploadedFileStatus.TEMPORARY) {
                throw (0, error_util_1.badRequest)('UPLOAD_NOT_FOUND', 'Uploaded file is not available');
            }
            if (file.uploadedById && file.uploadedById !== ownerUserId) {
                throw (0, error_util_1.forbidden)('UPLOAD_UNAUTHORIZED', 'Uploaded file belongs to another user');
            }
        }
        await client.uploadedFile.updateMany({
            where: { id: { in: fileIds }, status: client_1.UploadedFileStatus.TEMPORARY },
            data: { status: client_1.UploadedFileStatus.ATTACHED, uploadedById: ownerUserId },
        });
    }
    async cleanupExpiredTemporaryFiles(olderThan) {
        const files = await this.prisma.uploadedFile.findMany({
            where: {
                status: client_1.UploadedFileStatus.TEMPORARY,
                createdAt: { lt: olderThan },
                deletedAt: null,
            },
        });
        for (const file of files) {
            await this.storage.delete(file.storageKey);
            await this.prisma.uploadedFile.update({
                where: { id: file.id },
                data: { status: client_1.UploadedFileStatus.DELETED, deletedAt: new Date() },
            });
        }
        return { deleted: files.length };
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], UploadsService);
function toDto(file) {
    return {
        fileId: file.id,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        size: file.size,
        purpose: file.purpose,
    };
}
function parsePurpose(value) {
    if (!value || !(value in client_1.UploadPurpose)) {
        throw (0, error_util_1.badRequest)('UPLOAD_PURPOSE_INVALID', 'Upload purpose is invalid');
    }
    return client_1.UploadPurpose[value];
}
function validateFile(file, policy) {
    if (file.buffer.length > policy.maxSize) {
        throw (0, error_util_1.badRequest)('UPLOAD_FILE_TOO_LARGE', 'File is too large');
    }
    if (!policy.mimeTypes.includes(file.mimeType)) {
        throw (0, error_util_1.badRequest)('UPLOAD_MIME_NOT_ALLOWED', 'MIME type is not allowed');
    }
    const extension = path.extname(file.fileName).toLowerCase();
    if (!extension || !policy.extensions.includes(extension)) {
        throw (0, error_util_1.badRequest)('UPLOAD_MIME_NOT_ALLOWED', 'File extension is not allowed');
    }
    if (!signatureMatches(file.buffer, file.mimeType)) {
        throw (0, error_util_1.badRequest)('UPLOAD_SIGNATURE_INVALID', 'File signature does not match MIME type');
    }
}
function signatureMatches(buffer, mimeType) {
    if (mimeType === 'image/jpeg')
        return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === 'image/png')
        return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === 'image/webp')
        return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    if (mimeType === 'application/pdf')
        return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (mimeType.includes('officedocument'))
        return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    return false;
}
function extensionFor(fileName, mimeType) {
    const extension = path.extname(fileName).toLowerCase();
    if (extension)
        return extension;
    const fallback = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
    };
    return fallback[mimeType] ?? '.bin';
}
function safeOriginalName(fileName) {
    return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}
async function parseMultipartRequest(request) {
    const contentType = request.headers['content-type'] ?? '';
    const boundaryMatch = /boundary=([^;]+)/i.exec(Array.isArray(contentType) ? contentType[0] : contentType);
    if (!boundaryMatch)
        throw (0, error_util_1.badRequest)('BAD_REQUEST', 'multipart boundary is required');
    const contentLength = Number(request.headers['content-length'] ?? 0);
    if (contentLength > upload_policy_1.maxUploadSize + 4096)
        throw (0, error_util_1.badRequest)('UPLOAD_FILE_TOO_LARGE', 'File is too large');
    const body = await readRequestBody(request, upload_policy_1.maxUploadSize + 4096);
    const parts = splitMultipart(body, boundaryMatch[1]);
    const parsed = {};
    let fileCount = 0;
    for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd < 0)
            continue;
        const rawHeaders = part.subarray(0, headerEnd).toString('utf8');
        const content = trimTrailingCrlf(part.subarray(headerEnd + 4));
        const disposition = /content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i.exec(rawHeaders);
        if (!disposition)
            continue;
        const name = disposition[1];
        if (name !== 'file' && name !== 'purpose')
            throw (0, error_util_1.badRequest)('BAD_REQUEST', 'Unexpected multipart field');
        if (/[.[\]]/.test(name))
            throw (0, error_util_1.badRequest)('BAD_REQUEST', 'Nested multipart fields are not allowed');
        if (name === 'purpose') {
            parsed.purpose = content.toString('utf8').trim();
            continue;
        }
        fileCount += 1;
        if (fileCount > 1)
            throw (0, error_util_1.badRequest)('BAD_REQUEST', 'Only one file is allowed');
        const contentTypeHeader = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders);
        parsed.file = {
            fileName: disposition[2] ? path.basename(disposition[2]) : 'upload.bin',
            mimeType: contentTypeHeader?.[1]?.trim().toLowerCase() ?? 'application/octet-stream',
            buffer: content,
        };
    }
    return parsed;
}
async function readRequestBody(request, limit) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > limit)
            throw (0, error_util_1.badRequest)('UPLOAD_FILE_TOO_LARGE', 'File is too large');
        chunks.push(buffer);
    }
    return Buffer.concat(chunks);
}
function splitMultipart(body, boundaryValue) {
    const boundary = Buffer.from(`--${boundaryValue}`);
    const parts = [];
    let cursor = body.indexOf(boundary);
    while (cursor >= 0) {
        const next = body.indexOf(boundary, cursor + boundary.length);
        if (next < 0)
            break;
        let part = body.subarray(cursor + boundary.length, next);
        if (part.subarray(0, 2).toString('ascii') === '\r\n')
            part = part.subarray(2);
        if (part.subarray(0, 2).toString('ascii') !== '--')
            parts.push(part);
        cursor = next;
    }
    return parts;
}
function trimTrailingCrlf(buffer) {
    if (buffer.length >= 2 && buffer.subarray(buffer.length - 2).toString('ascii') === '\r\n') {
        return buffer.subarray(0, buffer.length - 2);
    }
    return buffer;
}
//# sourceMappingURL=uploads.service.js.map