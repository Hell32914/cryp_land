// Quick test for admin login
const API_URL = 'http://localhost:3001';

async function testLogin() {
  console.log('🧪 Testing CRM Login with admin/admin...\n');

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'admin', 
        password: 'admin' 
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Login failed:', response.status, error);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Login successful!');
    console.log('📝 Token received:', data.token.substring(0, 20) + '...');
    console.log('\n🎉 You can now login to CRM with:');
    console.log('   Username: admin');
    console.log('   Password: admin');
    console.log('\n🌐 CRM URL: http://localhost:5173');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Bot is running (npm start in telegram-bot)');
    console.error('   2. API is accessible on http://localhost:3001');
    process.exit(1);
  }
}

testLogin();
