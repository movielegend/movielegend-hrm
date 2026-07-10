import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/modules/storage/storage.service';
import { AssetsService } from '../src/modules/assets/assets.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storageService = app.get(StorageService);
  const assetsService = app.get(AssetsService);

  console.log('Testing Upload and Create Asset Flow...');
  
  try {
    // 1. Upload
    console.log('1. Uploading test image to Cloudinary...');
    const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    const uploadResult = await storageService.upload({
      buffer: imgBuffer,
      fileName: 'asset-test.png',
      mimeType: 'image/png',
      storageKey: 'asset-images/test-asset-123.png'
    });
    
    console.log('Upload Result:', uploadResult.fileUrl);

    // 2. Create Asset
    console.log('2. Creating Asset with the uploaded image URL...');
    const asset = await assetsService.create(
      {
        assetCode: 'TEST-AST-' + Math.floor(Math.random() * 10000),
        name: 'Bàn ghế văn phòng (Test Upload)',
        brand: 'Hòa Phát',
        model: 'X1',
        imageUrl: uploadResult.fileUrl,
        conditionNote: 'Mới 100%',
      },
      { userId: 'system', permissions: [] } as any // mock actor
    );
    
    console.log('Asset Created Successfully:', asset.assetCode, '| Image URL:', asset.imageUrl);
  } catch (err) {
    console.error('Test failed:', err);
  }

  await app.close();
}

bootstrap();
