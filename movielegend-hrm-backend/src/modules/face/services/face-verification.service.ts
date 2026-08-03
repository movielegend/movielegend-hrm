import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { Worker } from 'worker_threads';
import * as path from 'path';

export interface AttendanceFaceVerificationInput {
  userId: string;
  image?: string;
  storageKey?: string;
  imageBuffer?: Buffer;
}

export interface AttendanceFaceVerificationResult {
  matched: boolean;
  confidence?: number;
  reason?: string;
  provider?: string;
}

@Injectable()
export class FaceVerificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FaceVerificationService.name);
  private worker: Worker | null = null;
  private workerReady = false;
  private jobCounter = 0;
  private pendingJobs = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void }>();
  
  // Cache descriptor on the main thread to avoid reading source image buffer every time
  private descriptorCache = new Map<string, { url: string, descriptor: Float32Array }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Face API Worker Thread...');
    // In NestJS dist folder, the file is compiled to .js
    const workerPath = path.join(__dirname, 'face.worker.js');
    this.worker = new Worker(workerPath);
    
    this.worker.on('message', (message) => {
      if (message.type === 'INIT_DONE') {
        this.workerReady = true;
        this.logger.log('Face API Worker is ready and models loaded.');
      } else if (message.type === 'INIT_ERROR') {
        this.logger.error('Worker failed to init models: ' + message.error);
      } else if (message.jobId) {
        const job = this.pendingJobs.get(message.jobId);
        if (job) {
          job.resolve(message);
          this.pendingJobs.delete(message.jobId);
        }
      }
    });

    this.worker.on('error', (err) => {
      this.logger.error('Worker thread error:', err);
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        this.logger.error(`Worker stopped with exit code ${code}`);
      }
    });
  }

  onModuleDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  private runWorkerVerification(
    sourceDescriptor: Float32Array | undefined,
    sourceBuffer: Buffer | undefined,
    targetBuffer: Buffer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return reject(new Error('Worker is not initialized'));
      }
      const jobId = (++this.jobCounter).toString();
      this.pendingJobs.set(jobId, { resolve, reject });
      
      this.worker.postMessage({
        type: 'VERIFY',
        jobId,
        sourceDescriptor,
        sourceBuffer: sourceBuffer ? new Uint8Array(sourceBuffer) : undefined,
        targetBuffer: new Uint8Array(targetBuffer)
      });
    });
  }

  async verifyAttendanceFace(
    input: AttendanceFaceVerificationInput,
  ): Promise<AttendanceFaceVerificationResult> {
    if (!this.workerReady) {
      this.logger.warn('Local Face AI models not loaded. Mocking true.');
      return {
        matched: true,
        provider: 'mock',
        reason: 'Local AI models not loaded.',
      };
    }

    try {
      // 1. Get user's registered face
      const profile = await this.prisma.faceProfile.findUnique({
        where: { userId: input.userId },
        include: { images: true },
      });

      if (!profile || profile.status !== 'APPROVED' || profile.images.length === 0) {
        return {
          matched: false,
          provider: 'local-face-api-worker',
          reason: 'Người dùng chưa có khuôn mặt đăng ký được phê duyệt.',
        };
      }

      const registeredImageUrl = profile.images[0].imageUrl;
      let sourceDescriptor: Float32Array | undefined;
      let sourceBuffer: Buffer | undefined;
      
      const cached = this.descriptorCache.get(input.userId);
      if (cached && cached.url === registeredImageUrl) {
        sourceDescriptor = cached.descriptor;
      } else {
        try {
          if (registeredImageUrl.startsWith('http')) {
            const response = await fetch(registeredImageUrl);
            sourceBuffer = Buffer.from(await response.arrayBuffer());
          } else {
            sourceBuffer = await this.storage.read(registeredImageUrl);
          }
        } catch (e) {
          this.logger.error('Failed to read registered face image', e);
          return { matched: false, reason: 'Không thể tải dữ liệu khuôn mặt đã đăng ký của bạn. Vui lòng cập nhật lại khuôn mặt.' };
        }
      }

      // 2. Get target face (attendance photo)
      let targetBuffer: Buffer;
      try {
        if (input.imageBuffer) {
          targetBuffer = input.imageBuffer;
        } else if (input.storageKey) {
          targetBuffer = await this.storage.read(input.storageKey);
        } else if (input.image && input.image.startsWith('http')) {
          const response = await fetch(input.image);
          targetBuffer = Buffer.from(await response.arrayBuffer());
        } else if (input.image) {
          targetBuffer = await this.storage.read(input.image);
        } else {
          return { matched: false, reason: 'Không tìm thấy ảnh điểm danh để so sánh.' };
        }
      } catch (e) {
        this.logger.error('Failed to read attendance face image', e);
        return { matched: false, reason: 'Không thể tải ảnh điểm danh vừa chụp. Vui lòng thử lại.' };
      }

      // 3. Offload heavy verification to Worker Thread
      const result = await this.runWorkerVerification(sourceDescriptor, sourceBuffer, targetBuffer);

      // Cache the descriptor if it was newly calculated by the worker
      if (result.sourceDescriptor) {
        this.descriptorCache.set(input.userId, { url: registeredImageUrl, descriptor: result.sourceDescriptor });
      }

      return {
        matched: result.matched,
        confidence: result.confidence,
        provider: result.provider,
        reason: result.reason,
      };

    } catch (error: any) {
      this.logger.error(`Face verification failed: ${error.message}`, error.stack);
      return {
        matched: false,
        provider: 'local-face-api-worker',
        reason: 'Lỗi phân tích khuôn mặt: ' + error.message,
      };
    }
  }
}

