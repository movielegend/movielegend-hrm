import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import * as faceapi from '@vladmandic/face-api';
import * as path from 'path';
import sharp from 'sharp';

export interface AttendanceFaceVerificationInput {
  userId: string;
  image?: string;
  storageKey?: string;
}

export interface AttendanceFaceVerificationResult {
  matched: boolean;
  confidence?: number;
  reason?: string;
  provider?: string;
}

@Injectable()
export class FaceVerificationService implements OnModuleInit {
  private readonly logger = new Logger(FaceVerificationService.name);
  private modelsLoaded = false;
  private descriptorCache = new Map<string, { url: string, descriptor: Float32Array }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async onModuleInit() {
    try {
      const modelsPath = path.join(process.cwd(), 'src', 'assets', 'models');
      this.logger.log(`Loading face-api models from ${modelsPath} (Pure JS Mode)...`);

      // Monkey patch fetch to read local files
      const fetchMock = async (url: string) => {
        const filePath = path.join(modelsPath, path.basename(url));
        const fs = require('fs');
        const buffer = fs.readFileSync(filePath);
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(buffer.toString('utf8')),
          arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        } as any;
      };

      faceapi.env.monkeyPatch({ fetch: fetchMock });
      // Patch tfjs platform fetch as well because tfjs uses it to load the binary weights
      (faceapi.tf as any).env().platform.fetch = fetchMock;
      
      await faceapi.nets.ssdMobilenetv1.loadFromUri('http://localhost/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost/models');
      
      this.modelsLoaded = true;
      this.logger.log('Face-api models loaded successfully.');
    } catch (err: any) {
      this.logger.error('Failed to load face-api models. Please run download-models.js', err);
    }
  }

  /**
   * Helper to decode image and run face detection
   */
  private async getFaceDescriptor(buffer: Buffer): Promise<Float32Array | undefined> {
    const tensor = await this.bufferToTensor(buffer);
    try {
      const detection = await faceapi.detectSingleFace(tensor).withFaceLandmarks().withFaceDescriptor();
      return detection?.descriptor;
    } finally {
      tensor.dispose();
    }
  }

  private async bufferToTensor(buffer: Buffer) {
    // Decode and resize image using sharp (100x faster than Jimp)
    // Add failOn: 'none' to tolerate corrupt Android JPEGs
    const { data, info } = await sharp(buffer, { failOn: 'none' })
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
      .removeAlpha() // Ensure 3 channels (RGB)
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const values = Int32Array.from(data);
    return faceapi.tf.tensor3d(
      values,
      [info.height, info.width, 3],
      'int32'
    ) as faceapi.tf.Tensor3D;
  }

  async verifyAttendanceFace(
    input: AttendanceFaceVerificationInput,
  ): Promise<AttendanceFaceVerificationResult> {
    if (!this.modelsLoaded) {
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
          provider: 'local-face-api',
          reason: 'Người dùng chưa có khuôn mặt đăng ký được phê duyệt.',
        };
      }

      const registeredImageUrl = profile.images[0].imageUrl;
      let sourceDescriptor: Float32Array | undefined;
      
      const cached = this.descriptorCache.get(input.userId);
      if (cached && cached.url === registeredImageUrl) {
        sourceDescriptor = cached.descriptor;
      } else {
        let sourceBuffer: Buffer;
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
        
        const desc = await this.getFaceDescriptor(sourceBuffer);
        if (!desc) {
          return { matched: false, provider: 'local-face-api', reason: 'Không tìm thấy khuôn mặt rõ nét trong ảnh gốc đã đăng ký.' };
        }
        sourceDescriptor = desc;
        this.descriptorCache.set(input.userId, { url: registeredImageUrl, descriptor: desc });
      }

      // 2. Get target face (attendance photo)
      let targetBuffer: Buffer;
      try {
        if (input.storageKey) {
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

      // 3. Extract descriptors
      const targetDescriptor = await this.getFaceDescriptor(targetBuffer);
      if (!targetDescriptor) {
        return { matched: false, provider: 'local-face-api', reason: 'Không tìm thấy khuôn mặt người trong ảnh điểm danh này.' };
      }

      // 4. Calculate Distance
      const distance = faceapi.euclideanDistance(sourceDescriptor, targetDescriptor);
      
      // Usually distance < 0.6 is a match. Use 0.85 for looser matching (as requested).
      if (distance < 0.85) {
        return {
          matched: true,
          confidence: 1 - distance,
          provider: 'local-face-api',
        };
      } else {
        return {
          matched: false,
          confidence: 1 - distance,
          provider: 'local-face-api',
          reason: 'Khuôn mặt không khớp (Tỷ lệ sai lệch: ' + distance.toFixed(2) + '). Vui lòng thử lại.',
        };
      }
    } catch (error: any) {
      this.logger.error(`Face verification failed: ${error.message}`, error.stack);
      return {
        matched: false,
        provider: 'local-face-api',
        reason: 'Lỗi phân tích khuôn mặt: ' + error.message,
      };
    }
  }
}
