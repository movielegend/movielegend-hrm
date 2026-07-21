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
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (input.mimeType.startsWith('image/') || input.mimeType === 'application/pdf') resourceType = 'image';
      else if (input.mimeType.startsWith('video/') || input.mimeType.startsWith('audio/')) resourceType = 'video';
      else resourceType = 'raw';

      // Keep original file extension for raw files and PDFs so they have correct format when downloaded
      const publicId = input.storageKey 
        ? ((resourceType === 'raw' || input.mimeType === 'application/pdf') ? input.storageKey : input.storageKey.split('.')[0])
        : undefined;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hrm',
          public_id: publicId,
          resource_type: resourceType,
        },
        (error: any, result: any) => {
          if (error) {
            this.logger.error('Upload to Cloudinary failed', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned null result'));
          }
          
          let finalUrl = result.secure_url;
          if (input.mimeType === 'application/pdf' && finalUrl.includes('/upload/')) {
            finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
          }

          resolve({
            storageKey: result.public_id,
            fileUrl: finalUrl,
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
    const url = this.getPublicUrl(key);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to read file from Cloudinary: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}
