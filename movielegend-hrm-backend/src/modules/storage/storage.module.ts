import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './services/local-storage.service';
import { CloudinaryStorageService } from './services/cloudinary-storage.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      useFactory: (config: ConfigService) => {
        // Priority 1: Firebase Storage (if bucket is configured or we use default)
        // Actually, if we just want to replace Cloudinary, we can use an env flag or check bucket
        if (process.env.USE_FIREBASE_STORAGE === 'true' || process.env.FIREBASE_STORAGE_BUCKET) {
          return new FirebaseStorageService();
        }
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          return new CloudinaryStorageService(config);
        }
        return new LocalStorageService(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
