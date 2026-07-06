import { Module } from '@nestjs/common';
import { LocalStorageService } from './services/local-storage.service';
import { StorageService } from './storage.service';

@Module({
  providers: [{ provide: StorageService, useClass: LocalStorageService }],
  exports: [StorageService],
})
export class StorageModule {}
