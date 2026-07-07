import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ImageProcessingService } from './image-processing.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService, ImageProcessingService],
  exports: [UploadsService, ImageProcessingService],
})
export class UploadsModule {}
