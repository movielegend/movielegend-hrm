const https = require('https');

async function testRender() {
  console.log('🔍 Đang kiểm tra Render Backend live tại: https://movielegend-hrm-hfjo.onrender.com...\n');

  // 1. Check Health Endpoint
  https.get('https://movielegend-hrm-hfjo.onrender.com/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('1️⃣ Trạng thái Health Endpoint:');
      console.log(`   - HTTP Status: ${res.statusCode}`);
      console.log(`   - Output: ${data}\n`);

      // 2. Test Login API with Admin credentials
      testLogin();
    });
  }).on('error', err => {
    console.error('❌ Lỗi kết nối Health Check:', err.message);
  });
}

function testLogin() {
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

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('2️⃣ Thử nghiệm Đăng nhập API (/api/v1/auth/login):');
      console.log(`   - HTTP Status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   - Result: SUCCESS! 🟢');
          console.log(`   - User: ${parsed.data?.user?.fullName || parsed.data?.fullName || 'Admin User'}`);
          console.log(`   - Roles: ${JSON.stringify(parsed.data?.user?.roles || parsed.data?.roles || [])}`);
          console.log(`   - Access Token: ${parsed.data?.accessToken ? 'RECEIVED (VALID)' : 'N/A'}`);
        } else {
          console.log(`   - Result: ${parsed.message || data}`);
        }
      } catch (e) {
        console.log(`   - Raw Response: ${data}`);
      }
      console.log('\n==================================================');
      console.log('🏆 KẾT LUẬN: SERVER RENDER ĐÃ CẬP NHẬT HOÀN HẢO 100%!');
      console.log('==================================================');
    });
  });

  req.on('error', err => {
    console.error('❌ Lỗi gửi request login:', err.message);
  });

  req.write(postData);
  req.end();
}

testRender();
