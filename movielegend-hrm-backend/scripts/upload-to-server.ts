import { config } from 'dotenv';
import { resolve, basename } from 'path';
import { readFileSync, existsSync } from 'fs';

config({ path: resolve(__dirname, '../.env') });

const targetFiles = [
  `C:\\Users\\PC\\Downloads\\Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf`,
  `C:\\Users\\PC\\Downloads\\MovieLegend_App_Guide_Chuyen_Nghiep.pdf`,
  `C:\\Users\\PC\\Downloads\\Cam_nang_huong_dan_su_dung_Role_Leader.pdf`,
];

const baseUrl = 'https://glimmer-icky-status.ngrok-free.dev/api/v1';

async function main() {
  console.log('=== Logging in & Uploading PDF Guides to Remote Server ===\n');

  let token = '';

  const loginBodies = [
    { phone: '0900000000', password: 'admin123' },
    { email: 'HuuBao93@yahoo.com', password: 'admin123' },
  ];

  for (const body of loginBodies) {
    try {
      console.log(`Trying login with ${JSON.stringify(body)}...`);
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
      });

      const data: any = await res.json();
      if (res.ok && data?.data?.accessToken) {
        token = data.data.accessToken;
        console.log(`Login SUCCESSFUL! Token acquired.\n`);
        break;
      } else {
        console.log(`Login failed with status ${res.status}:`, data);
      }
    } catch (err: any) {
      console.error(`Login error: ${err.message}`);
    }
  }

  if (!token) {
    console.error('Could not authenticate with remote server via /auth/login!');
    process.exit(1);
  }

  const results: any[] = [];

  for (const filePath of targetFiles) {
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const fileName = basename(filePath);
    const buffer = readFileSync(filePath);

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const payloadHeader = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="purpose"`,
      ``,
      `EMPLOYEE_DOCUMENT`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: application/pdf`,
      ``,
      ``
    ].join('\r\n');

    const payloadFooter = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(payloadHeader),
      buffer,
      Buffer.from(payloadFooter)
    ]);

    console.log(`Uploading "${fileName}" (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to Cloudinary via ${baseUrl}/uploads...`);

    try {
      const response = await fetch(`${baseUrl}/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: bodyBuffer,
      });

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }

      if (!response.ok) {
        console.error(`Upload FAILED for ${fileName}:`, json);
      } else {
        console.log(`Upload SUCCESS for ${fileName}!`);
        console.log(`Result:`, json);
        results.push({ fileName, response: json });
      }
    } catch (err: any) {
      console.error(`Error uploading ${fileName}:`, err.message);
    }
  }

  console.log('\n=== FINAL UPLOAD SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('Fatal script error:', err);
});
