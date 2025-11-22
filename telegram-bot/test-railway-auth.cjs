const https = require('https');

const data = JSON.stringify({ username: 'admin', password: 'admin' });

const options = {
  hostname: 'crm-production-2806.up.railway.app',
  port: 443,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode === 503) {
      console.log('\n Переменные CRM_ADMIN_* не настроены на Railway!');
      console.log('Добавьте в Railway Variables:');
      console.log('  CRM_ADMIN_USERNAME=admin');
      console.log('  CRM_ADMIN_PASSWORD=admin');
      console.log('  CRM_JWT_SECRET=syntrix-jwt-secret-key-change-in-production-1492827344');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
