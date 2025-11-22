// test-railway-login.js
const fetch = require('node-fetch');

const RAILWAY_URL = 'YOUR_RAILWAY_URL_HERE'; // Замените на ваш URL

async function testLogin() {
  try {
    const response = await fetch(${RAILWAY_URL}/api/admin/login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
