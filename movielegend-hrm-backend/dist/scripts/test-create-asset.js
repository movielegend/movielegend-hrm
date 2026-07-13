"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const storage_service_1 = require("../src/modules/storage/storage.service");
const assets_service_1 = require("../src/modules/assets/assets.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const storageService = app.get(storage_service_1.StorageService);
    const assetsService = app.get(assets_service_1.AssetsService);
    console.log('Testing Upload and Create Asset Flow...');
    try {
        console.log('1. Uploading test image to Cloudinary...');
        const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        const uploadResult = await storageService.upload({
            buffer: imgBuffer,
            fileName: 'asset-test.png',
            mimeType: 'image/png',
            storageKey: 'asset-images/test-asset-123.png'
        });
        console.log('Upload Result:', uploadResult.fileUrl);
        console.log('2. Creating Asset with the uploaded image URL...');
        const asset = await assetsService.create({
            assetCode: 'TEST-AST-' + Math.floor(Math.random() * 10000),
            name: 'Bàn ghế văn phòng (Test Upload)',
            brand: 'Hòa Phát',
            model: 'X1',
            imageUrl: uploadResult.fileUrl,
            conditionNote: 'Mới 100%',
        }, { userId: 'system', permissions: [] });
        console.log('Asset Created Successfully:', asset.assetCode, '| Image URL:', asset.imageUrl);
    }
    catch (err) {
        console.error('Test failed:', err);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-create-asset.js.map