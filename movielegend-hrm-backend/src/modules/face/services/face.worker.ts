import { parentPort } from 'worker_threads';
import * as Module from 'module';
const originalRequire = (Module as any).prototype.require;
(Module as any).prototype.require = function (id: string) {
  if (id === '@tensorflow/tfjs-node') {
    return require('@tensorflow/tfjs');
  }
  return originalRequire.apply(this, arguments);
};

import * as faceapi from '@vladmandic/face-api';
import * as path from 'path';
import sharp from 'sharp';
import * as fs from 'fs';

function getModelsPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'assets', 'models'),
    path.join(process.cwd(), 'dist', 'src', 'assets', 'models'),
    path.join(process.cwd(), 'assets', 'models'),
    path.join(__dirname, '..', '..', '..', 'assets', 'models'),
    path.join(__dirname, '..', '..', '..', 'src', 'assets', 'models'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'face_recognition_model.bin'))) {
      return p;
    }
  }
  return path.join(process.cwd(), 'src', 'assets', 'models');
}

const modelsPath = getModelsPath();

const fetchMock = async (url: string) => {
  const filePath = path.join(modelsPath, path.basename(url));
  const buffer = fs.readFileSync(filePath);
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(buffer.toString('utf8')),
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  } as any;
};

faceapi.env.monkeyPatch({ fetch: fetchMock });
(faceapi.tf as any).env().platform.fetch = fetchMock;

let modelsLoaded = false;
const descriptorCache = new Map<string, { url: string, descriptor: Float32Array }>();

async function initModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('http://localhost/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('http://localhost/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('http://localhost/models')
    ]);
    modelsLoaded = true;
    parentPort?.postMessage({ type: 'INIT_DONE' });
  } catch (error) {
    parentPort?.postMessage({ type: 'INIT_ERROR', error: (error as Error).message });
  }
}

initModels();

async function bufferToTensor(buffer: Uint8Array) {
  const { data, info } = await sharp(Buffer.from(buffer), { failOn: 'none' })
    .rotate() // Automatically orient EXIF rotated images (from iOS devices)
    .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const values = Int32Array.from(data);
  return faceapi.tf.tensor3d(
    values,
    [info.height, info.width, 3],
    'int32'
  ) as faceapi.tf.Tensor3D;
}

async function getFaceDescriptor(buffer: Uint8Array): Promise<Float32Array | undefined> {
  const tensor = await bufferToTensor(buffer);
  try {
    // Fast lightweight detection at 320 input size with confident threshold
    let detection = await faceapi
      .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Fallback if not detected at 320 (e.g. low light)
    if (!detection) {
      detection = await faceapi
        .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!detection) return undefined;

    // Landmark verification: ensure key facial regions (eyes, nose, mouth) are present
    const landmarks = detection.landmarks;
    const mouth = landmarks.getMouth();
    const nose = landmarks.getNose();
    if (!mouth || mouth.length === 0 || !nose || nose.length === 0) {
      return undefined;
    }

    return detection.descriptor;
  } finally {
    tensor.dispose();
  }
}

parentPort?.on('message', async (message) => {
  if (message.type === 'VERIFY') {
    const { jobId, sourceDescriptor: providedSourceDescriptor, sourceBuffer, targetBuffer } = message;
    
    if (!modelsLoaded) {
      return parentPort?.postMessage({
        jobId,
        matched: false,
        provider: 'local-face-api-worker',
        reason: 'Hệ thống AI nhận diện đang tải mô hình. Vui lòng thử lại sau vài giây.',
      });
    }

    try {
      let sourceDescriptor = providedSourceDescriptor;
      
      if (!sourceDescriptor) {
        if (!sourceBuffer) {
           return parentPort?.postMessage({ jobId, matched: false, reason: 'Không có dữ liệu khuôn mặt đã đăng ký.' });
        }
        const desc = await getFaceDescriptor(sourceBuffer);
        if (!desc) {
          return parentPort?.postMessage({ jobId, matched: false, provider: 'local-face-api-worker', reason: 'Không tìm thấy khuôn mặt người trong ảnh gốc đã đăng ký.' });
        }
        sourceDescriptor = desc;
      }

      const targetDescriptor = await getFaceDescriptor(targetBuffer);
      if (!targetDescriptor) {
        return parentPort?.postMessage({
          jobId,
          matched: false,
          provider: 'local-face-api-worker',
          reason: 'Không phát hiện rõ khuôn mặt hoặc khuôn mặt bị che khuất (khẩu trang/tay che). Vui lòng chụp thẳng và rõ nét.',
        });
      }

      const distance = faceapi.euclideanDistance(sourceDescriptor, targetDescriptor);
      
      // Strict Security Golden Threshold (0.55) - Standard for FaceNet
      const MATCH_THRESHOLD = 0.55;

      if (distance < MATCH_THRESHOLD) {
        parentPort?.postMessage({
          jobId,
          matched: true,
          confidence: Number((1 - distance).toFixed(2)),
          provider: 'local-face-api-worker',
          sourceDescriptor: providedSourceDescriptor ? undefined : sourceDescriptor,
        });
      } else {
        parentPort?.postMessage({
          jobId,
          matched: false,
          confidence: Number((1 - distance).toFixed(2)),
          provider: 'local-face-api-worker',
          reason: `Khuôn mặt không khớp với hồ sơ nhân viên đã đăng ký (Tỷ lệ sai lệch: ${distance.toFixed(2)} / Ngưỡng cho phép: ${MATCH_THRESHOLD}). Vui lòng không chấm công hộ hoặc che mặt.`,
          sourceDescriptor: providedSourceDescriptor ? undefined : sourceDescriptor,
        });
      }
    } catch (error) {
      parentPort?.postMessage({
        jobId,
        matched: false,
        provider: 'local-face-api-worker',
        reason: 'Lỗi phân tích khuôn mặt (Worker): ' + (error as Error).message,
      });
    }
  }
});
