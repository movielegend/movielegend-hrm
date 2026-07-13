import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { StorageService, UploadInput, UploadResult } from '../storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    super();
    const driver = config.get<string>('storage.driver') ?? 'local';
    if (process.env.NODE_ENV === 'production' && driver === 'local') {
      console.warn('WARNING: Using local storage in production. Uploaded files will be lost when the container restarts.');
    }
    this.root = path.resolve(config.get<string>('storage.localRoot') ?? 'storage');
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const storageKey = sanitizeStorageKey(input.storageKey ?? input.fileName);
    const target = this.resolveKey(storageKey);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, input.buffer, { flag: 'wx' });
    return { storageKey, fileUrl: this.getPublicUrl(storageKey) };
  }

  async delete(key: string): Promise<void> {
    const target = this.resolveKey(key);
    await fs.unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }

  async exists(key: string): Promise<boolean> {
    const target = this.resolveKey(key);
    return fs
      .access(target)
      .then(() => true)
      .catch(() => false);
  }

  getPublicUrl(key: string): string {
    return `/uploads/${encodeURIComponent(sanitizeStorageKey(key))}`;
  }

  async read(key: string): Promise<Buffer> {
    const target = this.resolveKey(key);
    return fs.readFile(target);
  }

  private resolveKey(key: string): string {
    const clean = sanitizeStorageKey(key);
    const target = path.resolve(this.root, clean);
    if (!target.startsWith(this.root + path.sep)) {
      throw new Error('Invalid storage key');
    }
    return target;
  }
}

function sanitizeStorageKey(value: string): string {
  return value.replace(/\\/g, '/').split('/').filter(Boolean).join('/').replace(/[^a-zA-Z0-9._/-]/g, '_');
}
