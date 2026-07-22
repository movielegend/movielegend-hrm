import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadInput, UploadResult } from '../storage.service';
import * as admin from 'firebase-admin';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseStorageService implements StorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private bucket: ReturnType<typeof admin.storage.prototype.bucket>;
  private isInitialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    if (!admin.apps.length) {
      try {
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
          });
          this.isInitialized = true;
          this.logger.log('Firebase Admin initialized for Storage');
        } else {
          this.logger.error('firebase-service-account.json not found in backend root!');
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin', error);
      }
    } else {
      this.isInitialized = true;
    }
    
    if (this.isInitialized) {
      this.bucket = admin.storage().bucket();
    }
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    if (!this.isInitialized) {
      throw new Error('Firebase Admin not initialized. Check service account JSON.');
    }

    return new Promise(async (resolve, reject) => {
      try {
        let storageKey = input.storageKey;
        if (!storageKey) {
          const ext = input.fileName ? extname(input.fileName) : '';
          storageKey = `hrm/uploads/${uuidv4()}${ext}`;
        }
        
        const file = this.bucket.file(storageKey);
        
        await file.save(input.buffer, {
          metadata: {
            contentType: input.mimeType,
          },
          resumable: false,
        });

        await file.makePublic();
        const fileUrl = file.publicUrl();

        resolve({
          storageKey,
          fileUrl,
        });
      } catch (error) {
        this.logger.error('Upload to Firebase Storage failed', error);
        reject(error);
      }
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.isInitialized) return;
    try {
      await this.bucket.file(key).delete();
    } catch (error) {
      this.logger.error(`Failed to delete file from Firebase Storage: ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isInitialized) return false;
    try {
      const [exists] = await this.bucket.file(key).exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (!this.isInitialized) return '';
    return this.bucket.file(key).publicUrl();
  }

  async read(key: string): Promise<Buffer> {
    if (!this.isInitialized) throw new Error('Not initialized');
    try {
      const [buffer] = await this.bucket.file(key).download();
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to read file from Firebase Storage: ${key}`, error);
      throw error;
    }
  }
}
