import { S3Client, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

async function main() {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: 'https://331285f27ff975a9ece088e22ddc8124.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: 'd5dbaded9f17a54d644db2a67f49cb85',
      secretAccessKey: '74a098bb5dc17efb2d5b5098025ea98024c25e21212aa00c99fd20833724e121',
    },
    forcePathStyle: true,
  });

  try {
    const key = 'contract_template/2026-07-31/316f7836-147e-4590-851e-6b97a5bcf83c.pdf';
    
    // Test HeadObject (exists)
    const headCommand = new HeadObjectCommand({ Bucket: 'erp-contracts', Key: key });
    await s3Client.send(headCommand);
    console.log('Exists: true');
    
    // Test GetObject (read)
    const getCommand = new GetObjectCommand({ Bucket: 'erp-contracts', Key: key });
    const response = await s3Client.send(getCommand);
    const stream = response.Body as NodeJS.ReadableStream;
    const buf = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
    console.log('Read buffer size:', buf.length);
  } catch (err) {
    console.error('Error reading:', err);
  }
}

main();
