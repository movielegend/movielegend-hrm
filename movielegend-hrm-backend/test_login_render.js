const https = require('https');

const postData = JSON.stringify({
  phone: '0900000000',
  password: 'admin123'
});

const options = {
  hostname: 'movielegend-hrm-hfjo.onrender.com',
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Đang test Đăng nhập trực tiếp trên Render...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', err => {
  console.error('Lỗi:', err.message);
});

req.write(postData);
req.end();
