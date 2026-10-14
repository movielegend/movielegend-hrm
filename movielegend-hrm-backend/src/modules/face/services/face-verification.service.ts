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
  
  // Cache descriptors per user and per pose (FRONT, LEFT, RIGHT)
  private descriptorCache = new Map<string, Map<string, { url: string, descriptor: Float32Array }>>();

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
    targetBuffer: Buffer,
    candidates?: Array<{ id: string; pose: string; descriptor?: Float32Array; buffer?: Uint8Array }>,
    sourceDescriptor?: Float32Array,
    sourceBuffer?: Buffer,
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
        candidates,
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
      this.logger.warn('Local Face AI models not ready yet.');
      return {
        matched: false,
        provider: 'local-face-api-worker',
        reason: 'Hệ thống AI nhận diện đang tải dữ liệu. Vui lòng thử lại sau vài giây.',
      };
    }

    try {
      // 1. Get user's registered face profiles
      const profile = await this.prisma.faceProfile.findUnique({
        where: { userId: input.userId },
        include: { images: true },
      });

      if (!profile || profile.status !== 'APPROVED' || profile.images.length === 0) {
        return {
          matched: false,
          provider: 'local-face-api-worker',
          reason: 'Người dùng chưa có khuôn mặt đăng ký được phê duyệt. Vui lòng vào hồ sơ để thiết lập khuôn mặt.',
        };
      }

      let userPoseCache = this.descriptorCache.get(input.userId);
      if (!userPoseCache) {
        userPoseCache = new Map();
        this.descriptorCache.set(input.userId, userPoseCache);
      }

      // Helper to read image buffer from storage or URL
      const readImageBuffer = async (imageUrl: string): Promise<Buffer | undefined> => {
        try {
          const storageKey = this.storage.extractKeyFromUrl(imageUrl) || imageUrl;
          try {
            const buf = await this.storage.read(storageKey);
            if (buf) return buf;
          } catch {}

          if (imageUrl.startsWith('http')) {
            const resp = await fetch(imageUrl);
            if (resp.ok) return Buffer.from(await resp.arrayBuffer());
          }
        } catch (e) {
          this.logger.warn(`Could not read registered image buffer for url: ${imageUrl}`);
        }
        return undefined;
      };

      const candidates: Array<{ id: string; pose: string; descriptor?: Float32Array; buffer?: Uint8Array }> = [];

      for (const img of profile.images) {
        const cached = userPoseCache.get(img.pose);
        if (cached && cached.url === img.imageUrl) {
          candidates.push({ id: img.id, pose: img.pose, descriptor: cached.descriptor });
        } else {
          const buf = await readImageBuffer(img.imageUrl);
          if (buf) {
            candidates.push({ id: img.id, pose: img.pose, buffer: new Uint8Array(buf) });
          }
        }
      }

      if (candidates.length === 0) {
        return {
          matched: false,
          reason: 'Không thể tải dữ liệu khuôn mặt đã đăng ký của bạn. Vui lòng cập nhật lại khuôn mặt trong hồ sơ cá nhân.',
        };
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

      // 3. Offload multi-pose verification to Worker Thread
      const result = await this.runWorkerVerification(targetBuffer, candidates);

      // Cache newly computed descriptors per pose
      if (Array.isArray(result.newDescriptors)) {
        for (const item of result.newDescriptors) {
          const imgRecord = profile.images.find((i) => i.id === item.id || i.pose === item.pose);
          if (imgRecord) {
            userPoseCache.set(item.pose, { url: imgRecord.imageUrl, descriptor: item.descriptor });
          }
        }
      }

      if (result.matched) {
        this.logger.log(`Face match verified for user ${input.userId} (Pose: ${result.bestPose ?? 'FRONT'}, Confidence: ${result.confidence})`);
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

  clearUserCache(userId: string) {
    this.descriptorCache.delete(userId);
  }
}

