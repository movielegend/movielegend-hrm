import * as Module from 'module';
const originalRequire = (Module as any).prototype.require;
(Module as any).prototype.require = function (id: string) {
  if (id === '@tensorflow/tfjs-node') {
    return require('@tensorflow/tfjs');
  }
  return originalRequire.apply(this, arguments);
};

import { config } from 'dotenv';
import { resolve, basename, extname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { PrismaClient, UploadPurpose, UploadedFileStatus } from '@prisma/client';
import { CloudinaryStorageService } from '../src/modules/storage/services/cloudinary-storage.service';
import { LocalStorageService } from '../src/modules/storage/services/local-storage.service';
import { ConfigService } from '@nestjs/config';

config({ path: resolve(__dirname, '../.env') });

const targetFiles = [
  `C:\\Users\\PC\\Downloads\\Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf`,
  `C:\\Users\\PC\\Downloads\\MovieLegend_App_Guide_Chuyen_Nghiep.pdf`,
  `C:\\Users\\PC\\Downloads\\Cam_nang_huong_dan_su_dung_Role_Leader.pdf`,
];

async function main() {
  console.log('=== Uploading PDF Guide Files ===');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const hasCloudinary = !!cloudName && !!process.env.CLOUDINARY_API_KEY;

  console.log('Cloudinary Configured:', hasCloudinary ? `YES (${cloudName})` : 'NO (Using Local Storage fallback)');

  const prisma = new PrismaClient();
  const configService = new ConfigService();
  const storageService = hasCloudinary 
    ? new CloudinaryStorageService(configService)
    : new LocalStorageService(configService);

  const results: Array<{ fileName: string; fileId: string; fileUrl: string; size: number; storage: string }> = [];

  for (const filePath of targetFiles) {
    if (!existsSync(filePath)) {
      console.error(`File NOT found at path: ${filePath}`);
      continue;
    }

    const fileName = basename(filePath);
    const buffer = readFileSync(filePath);
    const ext = extname(fileName).toLowerCase();
    const storageKey = `employee_document/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    const checksum = createHash('sha256').update(buffer).digest('hex');

    console.log(`\nUploading "${fileName}" (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    try {
      const stored = await storageService.upload({
        buffer,
        fileName,
        mimeType: 'application/pdf',
        storageKey,
      });

      console.log(`Upload Success! URL: ${stored.fileUrl}`);

      const record = await prisma.uploadedFile.create({
        data: {
          purpose: UploadPurpose.EMPLOYEE_DOCUMENT,
          status: UploadedFileStatus.ATTACHED,
          fileName,
          storageKey: stored.storageKey,
          fileUrl: stored.fileUrl,
          mimeType: 'application/pdf',
          size: buffer.length,
          checksum,
        },
      });

      results.push({
        fileName,
        fileId: record.id,
        fileUrl: record.fileUrl,
        size: buffer.length,
        storage: hasCloudinary ? 'Cloudinary' : 'Local Storage',
      });
    } catch (err: any) {
      console.error(`Failed to upload ${fileName}:`, err?.message || err);
    }
  }

  console.log('\n=== UPLOAD SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
