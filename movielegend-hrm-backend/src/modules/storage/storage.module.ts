import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './services/local-storage.service';
import { CloudinaryStorageService } from './services/cloudinary-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      useFactory: (config: ConfigService) => {
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
