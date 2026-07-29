import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadInput, UploadResult } from '../storage.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';

@Injectable()
export class CloudinaryStorageService implements StorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private readonly localStorageFallback: LocalStorageService;

  constructor(configService: ConfigService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.localStorageFallback = new LocalStorageService(configService);
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const isPdf = 
      input.mimeType === 'application/pdf' || 
      (input.fileName && input.fileName.toLowerCase().endsWith('.pdf')) ||
      (input.storageKey && input.storageKey.toLowerCase().endsWith('.pdf'));
    
    if (isPdf) {
      this.logger.log('Delegating PDF upload to LocalStorageService');
      return this.localStorageFallback.upload(input);
    }

    return new Promise((resolve, reject) => {
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (input.mimeType.startsWith('image/')) resourceType = 'image';
      else if (input.mimeType.startsWith('video/') || input.mimeType.startsWith('audio/')) resourceType = 'video';
      else resourceType = 'raw';

      // Keep original file extension for raw files so they have correct format when downloaded
      const publicId = input.storageKey 
        ? ((resourceType === 'raw') ? input.storageKey : input.storageKey.split('.')[0])
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
      if (key.toLowerCase().endsWith('.pdf')) {
        await this.localStorageFallback.delete(key);
        return;
      }
      await cloudinary.uploader.destroy(key);
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (key.toLowerCase().endsWith('.pdf')) {
        return this.localStorageFallback.exists(key);
      }
      const result = await cloudinary.api.resource(key);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (key.toLowerCase().endsWith('.pdf')) {
      return this.localStorageFallback.getPublicUrl(key);
    }
    return cloudinary.url(key, { secure: true });
  }

  async read(key: string): Promise<Buffer> {
    if (key.toLowerCase().endsWith('.pdf')) {
      return this.localStorageFallback.read(key);
    }
    const url = this.getPublicUrl(key);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to read file from Cloudinary: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    
    // Nếu là PDF thì nó đang trỏ về LocalStorage (fallback)
    if (url.includes('/uploads/')) {
      return this.localStorageFallback.extractKeyFromUrl(url);
    }

    // Cloudinary url format: https://res.cloudinary.com/.../upload/v1234/hrm/filename.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(hrm\/.*)$/);
    if (match) {
      let key = decodeURIComponent(match[1]);
      // Cloudinary delete method (destroy) doesn't use extension for images
      // But wait! This extractKeyFromUrl returns the key that will be passed to `delete()`
      // Our delete method in cloudinary-storage.service.ts does: 
      // await cloudinary.uploader.destroy(key);
      // Wait, cloudinary needs the extension REMOVED.
      if (!key.toLowerCase().endsWith('.pdf')) {
         key = key.split('.')[0];
      }
      return key;
    }
    
    return null;
  }
}
