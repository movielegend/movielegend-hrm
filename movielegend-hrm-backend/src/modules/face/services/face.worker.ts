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

const modelsPath = path.join(process.cwd(), 'src', 'assets', 'models');

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
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
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
    const detection = await faceapi.detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    return detection?.descriptor;
  } finally {
    tensor.dispose();
  }
}

parentPort?.on('message', async (message) => {
  if (message.type === 'VERIFY') {
    const { jobId, sourceDescriptor: providedSourceDescriptor, sourceBuffer, targetBuffer } = message;
    
    if (!modelsLoaded) {
      return parentPort?.postMessage({ jobId, matched: true, provider: 'mock', reason: 'Worker models not loaded yet.' });
    }

    try {
      let sourceDescriptor = providedSourceDescriptor;
      
      if (!sourceDescriptor) {
        if (!sourceBuffer) {
           return parentPort?.postMessage({ jobId, matched: false, reason: 'No source descriptor or buffer provided' });
        }
        const desc = await getFaceDescriptor(sourceBuffer);
        if (!desc) {
          return parentPort?.postMessage({ jobId, matched: false, provider: 'local-face-api-worker', reason: 'Không tìm thấy khuôn mặt người trong ảnh gốc đã đăng ký.' });
        }
        sourceDescriptor = desc;
      }

      const targetDescriptor = await getFaceDescriptor(targetBuffer);
      if (!targetDescriptor) {
        return parentPort?.postMessage({ jobId, matched: false, provider: 'local-face-api-worker', reason: 'Không tìm thấy khuôn mặt người trong ảnh điểm danh này.' });
      }

      const distance = faceapi.euclideanDistance(sourceDescriptor, targetDescriptor);
      
      if (distance < 0.75) {
        parentPort?.postMessage({
          jobId,
          matched: true,
          confidence: 1 - distance,
          provider: 'local-face-api-worker',
          sourceDescriptor: providedSourceDescriptor ? undefined : sourceDescriptor,
        });
      } else {
        parentPort?.postMessage({
          jobId,
          matched: false,
          confidence: 1 - distance,
          provider: 'local-face-api-worker',
          reason: `Khuôn mặt không khớp (Tỷ lệ sai lệch: ${distance.toFixed(2)}). Vui lòng thử lại.`,
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
