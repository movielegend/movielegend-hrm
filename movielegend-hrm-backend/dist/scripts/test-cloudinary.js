"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const storage_service_1 = require("../src/modules/storage/storage.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const storageService = app.get(storage_service_1.StorageService);
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
    }
    catch (err) {
        console.error('Test failed:', err);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-cloudinary.js.map