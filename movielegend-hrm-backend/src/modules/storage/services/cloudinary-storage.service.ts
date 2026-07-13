import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadInput, UploadResult } from '../storage.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryStorageService implements StorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hrm',
          public_id: input.storageKey ? input.storageKey.split('.')[0] : undefined,
          resource_type: 'auto',
        },
        (error: any, result: any) => {
          if (error) {
            this.logger.error('Upload to Cloudinary failed', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned null result'));
          }
          
          resolve({
            storageKey: result.public_id,
            fileUrl: result.secure_url,
          });
        },
      );

      streamifier.createReadStream(input.buffer).pipe(uploadStream);
    });
  }

  async delete(key: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(key);
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(key);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return cloudinary.url(key, { secure: true });
  }

  async read(key: string): Promise<Buffer> {
    throw new Error('read() is not supported by CloudinaryStorageService natively');
  }
}
