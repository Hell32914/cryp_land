const https = require('https');

const data = JSON.stringify({ username: 'admin', password: 'admin' });

const options = {
  hostname: 'syntrix-bot.onrender.com',
  port: 443,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Тестирую авторизацию на Render...\n');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    console.log('');
    
    if (res.statusCode === 503) {
      console.log(' ПРОБЛЕМА: Переменные CRM_ADMIN_* не настроены на Render!');
      console.log('');
      console.log('Добавьте на Render.com в Environment Variables:');
      console.log('  CRM_ADMIN_USERNAME=admin');
      console.log('  CRM_ADMIN_PASSWORD=admin');
      console.log('  CRM_JWT_SECRET=syntrix-jwt-secret-key-change-in-production-1492827344');
    } else if (res.statusCode === 200) {
      console.log(' Авторизация успешна!');
    } else if (res.statusCode === 401) {
      console.log(' Неверные учетные данные');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
