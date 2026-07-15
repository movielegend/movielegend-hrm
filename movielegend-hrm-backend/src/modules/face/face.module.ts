import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FaceVerificationService } from './services/face-verification.service';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule, DatabaseModule, StorageModule],
  providers: [FaceVerificationService],
  exports: [FaceVerificationService],
})
export class FaceModule {}
