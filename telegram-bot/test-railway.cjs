const https = require('https');

const data = JSON.stringify({ username: 'admin', password: 'admin' });

const options = {
  hostname: 'crypland-production.up.railway.app',
  port: 443,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Тестирую авторизацию на Railway...\n');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Response:', body);
    console.log('');
    
    if (res.statusCode === 503) {
      console.log(' ПРОБЛЕМА: Переменные CRM не настроены на Railway!');
      console.log('');
      console.log('Добавьте в Railway Variables (сервис telegram-bot):');
      console.log('  CRM_ADMIN_USERNAME=admin');
      console.log('  CRM_ADMIN_PASSWORD=admin');
      console.log('  CRM_JWT_SECRET=syntrix-jwt-secret-key-change-in-production-1492827344');
    } else if (res.statusCode === 200) {
      console.log(' Авторизация успешна! Токен получен.');
    } else if (res.statusCode === 401) {
      console.log(' Неверные учетные данные');
    }
  });
});

req.on('error', (error) => {
  console.error('Ошибка подключения:', error.message);
});

req.write(data);
req.end();
