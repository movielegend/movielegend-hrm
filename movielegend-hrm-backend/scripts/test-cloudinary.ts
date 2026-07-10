import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/modules/storage/storage.service';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storageService = app.get(StorageService);

  console.log('Testing StorageService...');
  
  try {
    const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    console.log('Uploading test image to Cloudinary...');
    const result = await storageService.upload({
      buffer: imgBuffer,
      fileName: 'test-image.png',
      mimeType: 'image/png',
      storageKey: 'test/asset-image-123.png'
    });
    
    console.log('Upload Result:', result);
    console.log('Test successful! Cloudinary integration is working.');
  } catch (err) {
    console.error('Test failed:', err);
  }

  await app.close();
}

bootstrap();
