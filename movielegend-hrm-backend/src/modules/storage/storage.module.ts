import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './services/local-storage.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

import { CloudinaryStorageService } from './services/cloudinary-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      useFactory: (config: ConfigService) => {
        // Ưu tiên sử dụng Cloudinary nếu có cấu hình
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          return new CloudinaryStorageService(config);
        }

        // Mặc định sử dụng Local Storage
        return new LocalStorageService(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
