import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService, UploadInput, UploadResult } from '../storage.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicDomain: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID')!;
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY')!;
    const region = this.configService.get<string>('S3_REGION') || 'auto';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME')!;
    this.publicDomain = this.configService.get<string>('S3_PUBLIC_DOMAIN')!;

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Needed for many S3 compatible services like R2
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    try {
      const { buffer, fileName, mimeType, storageKey } = input;
      const key = storageKey || `uploads/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      return {
        storageKey: key,
        fileUrl: this.getPublicUrl(key),
      };
    } catch (error) {
      this.logger.error('Upload to S3/R2 failed', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3/R2: ${key}`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.logger.error(`Failed to check if file exists in S3/R2: ${key}`, error);
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (!this.publicDomain) return '';
    const baseUrl = this.publicDomain.endsWith('/') ? this.publicDomain : `${this.publicDomain}/`;
    return `${baseUrl}${key}`;
  }

  async read(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Response body is empty');
      }

      const stream = response.Body as NodeJS.ReadableStream;
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Failed to read file from S3/R2: ${key}`, error);
      throw error;
    }
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url || !this.publicDomain) return null;
    try {
      const baseUrl = this.publicDomain.endsWith('/') ? this.publicDomain : `${this.publicDomain}/`;
      if (url.startsWith(baseUrl)) {
        return url.substring(baseUrl.length);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
