import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './services/local-storage.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { StorageService } from './storage.service';
import { MediaStorageService } from './media-storage.service';
import * as fs from 'fs';
import * as path from 'path';

import { CloudinaryStorageService } from './services/cloudinary-storage.service';
import { S3StorageService } from './services/s3-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      useFactory: (config: ConfigService) => {
        // Chỉ sử dụng S3/R2 cho StorageService (nếu có cấu hình)
        if (config.get('S3_ENDPOINT') && config.get('S3_ACCESS_KEY_ID')) {
          return new S3StorageService(config);
        }

        // Mặc định sử dụng Local Storage
        return new LocalStorageService(config);
      },
      inject: [ConfigService],
    },
    {
      provide: MediaStorageService,
      useFactory: (config: ConfigService) => {
        // Ưu tiên sử dụng Cloudinary cho MediaStorageService nếu có cấu hình
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          return new CloudinaryStorageService(config);
        }

        // Mặc định sử dụng Local Storage
        return new LocalStorageService(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService, MediaStorageService],
})
export class StorageModule {}
