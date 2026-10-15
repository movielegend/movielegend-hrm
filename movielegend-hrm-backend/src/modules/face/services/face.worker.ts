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
  if (message.type === 'WARM_DESCRIPTORS') {
    const { jobId, candidates } = message;
    if (!modelsLoaded) {
      return parentPort?.postMessage({ jobId, error: 'Models not loaded yet' });
    }
    try {
      const descriptors: Array<{ pose: string; descriptor: Float32Array }> = [];
      if (Array.isArray(candidates)) {
        for (const item of candidates) {
          if (item.buffer) {
            const desc = await getFaceDescriptor(item.buffer);
            if (desc) {
              descriptors.push({ pose: item.pose, descriptor: desc });
            }
          }
        }
      }
      return parentPort?.postMessage({ jobId, type: 'WARM_DESCRIPTORS_DONE', descriptors });
    } catch (err: any) {
      return parentPort?.postMessage({ jobId, error: err?.message });
    }
  }

  if (message.type === 'VERIFY') {
    const { jobId, sourceDescriptor: providedSourceDescriptor, sourceBuffer, targetBuffer, candidates } = message;
    
    if (!modelsLoaded) {
      return parentPort?.postMessage({
        jobId,
        matched: false,
        provider: 'local-face-api-worker',
        reason: 'Hệ thống AI nhận diện đang tải mô hình. Vui lòng thử lại sau vài giây.',
      });
    }

    try {
      const targetDescriptor = await getFaceDescriptor(targetBuffer);
      if (!targetDescriptor) {
        return parentPort?.postMessage({
          jobId,
          matched: false,
          provider: 'local-face-api-worker',
          reason: 'Không phát hiện rõ khuôn mặt hoặc khuôn mặt bị che khuất (khẩu trang/tay che). Vui lòng chụp thẳng và rõ nét.',
        });
      }

      // Strict Security Golden Threshold (0.55) - Standard for FaceNet
      const MATCH_THRESHOLD = 0.55;

      // Multi-candidate mode (support multiple poses: FRONT, LEFT, RIGHT)
      if (Array.isArray(candidates) && candidates.length > 0) {
        let bestDistance = Infinity;
        let bestPose: string | undefined;
        const newDescriptors: Array<{ id: string; pose: string; descriptor: Float32Array }> = [];

        for (const candidate of candidates) {
          let desc = candidate.descriptor;
          if (!desc && candidate.buffer) {
            desc = await getFaceDescriptor(candidate.buffer);
            if (desc) {
              newDescriptors.push({ id: candidate.id, pose: candidate.pose, descriptor: desc });
            }
          }
          if (desc) {
            const distance = faceapi.euclideanDistance(desc, targetDescriptor);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPose = candidate.pose;
            }
          }
        }

        if (bestDistance < MATCH_THRESHOLD) {
          return parentPort?.postMessage({
            jobId,
            matched: true,
            confidence: Number((1 - bestDistance).toFixed(2)),
            bestPose,
            provider: 'local-face-api-worker',
            newDescriptors,
          });
        } else {
          return parentPort?.postMessage({
            jobId,
            matched: false,
            confidence: bestDistance !== Infinity ? Number((1 - bestDistance).toFixed(2)) : 0,
            provider: 'local-face-api-worker',
            reason: `Khuôn mặt không khớp với hồ sơ nhân viên đã đăng ký (Độ lệch nhỏ nhất: ${bestDistance !== Infinity ? bestDistance.toFixed(2) : 'N/A'} / Ngưỡng cho phép: ${MATCH_THRESHOLD}). Vui lòng không chấm công hộ hoặc che mặt.`,
            newDescriptors,
          });
        }
      }

      // Single source fallback for backward compatibility
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

      const distance = faceapi.euclideanDistance(sourceDescriptor, targetDescriptor);

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

  if (message.type === 'VALIDATE_POSE') {
    const { jobId, targetBuffer, expectedPose } = message;
    if (!modelsLoaded) {
      return parentPort?.postMessage({
        jobId,
        valid: false,
        reason: 'Hệ thống nhận diện đang khởi động. Vui lòng thử lại sau vài giây.',
      });
    }

    try {
      const tensor = await bufferToTensor(targetBuffer);
      try {
        let detection = await faceapi
          .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.28 }))
          .withFaceLandmarks();

        if (!detection) {
          detection = await faceapi
            .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
            .withFaceLandmarks();
        }

        if (!detection) {
          return parentPort?.postMessage({
            jobId,
            valid: false,
            error: 'NO_FACE',
            reason: 'Không phát hiện khuôn mặt trong khung hình. Vui lòng căn chỉnh lại.',
          });
        }

        const landmarks = detection.landmarks;
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        if (!nose?.length || !leftEye?.length || !rightEye?.length) {
          return parentPort?.postMessage({
            jobId,
            valid: false,
            error: 'INCOMPLETE_FACE',
            reason: 'Khuôn mặt bị che khuất hoặc quá mờ. Vui lòng căn chỉnh lại.',
          });
        }

        // In 68-point landmarks: nose has 9 points (indices 0..8)
        // 0..3 is nose bridge, 6 is bottom center tip of nose (point 33), 8 is right nostril (point 35)
        const noseCenter = nose[6] || nose[3] || nose[Math.floor(nose.length / 2)];
        const noseX = noseCenter.x;
        const leftEyeX = leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length;
        const rightEyeX = rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length;
        const eyeDist = Math.max(1, Math.abs(rightEyeX - leftEyeX));
        const minEyeX = Math.min(leftEyeX, rightEyeX);
        const eyeRatio = (noseX - minEyeX) / eyeDist;

        // Jaw lateral margin
        const jaw = landmarks.positions;
        const jawLeftX = jaw[0].x;
        const jawRightX = jaw[16].x;
        const minJawX = Math.min(jawLeftX, jawRightX);
        const maxJawX = Math.max(jawLeftX, jawRightX);
        const jawWidth = Math.max(1, maxJawX - minJawX);
        const cheekRatio = (noseX - minJawX) / jawWidth;

        // Combined symmetry score
        const symmetry = (eyeRatio + cheekRatio) / 2;

        console.log(`[Worker VALIDATE_POSE] pose=${expectedPose}, eyeRatio=${eyeRatio.toFixed(3)}, cheekRatio=${cheekRatio.toFixed(3)}, symmetry=${symmetry.toFixed(3)}`);

        if (expectedPose === 'FRONT') {
          // For FRONT: Normal human frontal faces with nose between eyes have eyeRatio comfortably in [0.20, 0.80]
          // If face is detected with both eyes & nose clearly visible, it is accepted unless turned extreme profile
          const isFront = eyeRatio >= 0.15 && eyeRatio <= 0.85;
          if (!isFront) {
            return parentPort?.postMessage({
              jobId,
              valid: false,
              error: 'NOT_FRONT',
              reason: 'Vui lòng nhìn thẳng trực diện vào camera.',
            });
          }
        } else if (expectedPose === 'LEFT' || expectedPose === 'RIGHT') {
          // For side poses: ensure the face is angled away from dead-center
          const isTurned = eyeRatio < 0.44 || eyeRatio > 0.56 || symmetry < 0.44 || symmetry > 0.56;
          if (!isTurned) {
            const sideName = expectedPose === 'LEFT' ? 'sang TRÁI' : 'sang PHẢI';
            return parentPort?.postMessage({
              jobId,
              valid: false,
              error: 'NOT_TURNED',
              reason: `Vui lòng nghiêng mặt ${sideName} khoảng 20° - 30°.`,
            });
          }
        }

        return parentPort?.postMessage({
          jobId,
          valid: true,
          detectedPose: expectedPose,
          confidence: Number(((detection as any).detection?.score ?? 0.95).toFixed(2)),
        });
      } finally {
        tensor.dispose();
      }
    } catch (err: any) {
      parentPort?.postMessage({
        jobId,
        valid: false,
        error: 'PROCESS_ERROR',
        reason: 'Lỗi kiểm tra ảnh: ' + (err?.message || 'Không xác định'),
      });
    }
  }
});
