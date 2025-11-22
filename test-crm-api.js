// Test CRM API connection
const API_URL = 'http://localhost:3001';
const USERNAME = 'admin';
const PASSWORD = 'Syntrix2025!Secure'; // Replace with your actual password

async function testAPI() {
  console.log('🧪 Testing CRM API Connection...\n');

  try {
    // 1. Test Login
    console.log('1️⃣ Testing login...');
    const loginRes = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const { token } = await loginRes.json();
    console.log('✅ Login successful! Token received.\n');

    // 2. Test Overview
    console.log('2️⃣ Testing overview endpoint...');
    const overviewRes = await fetch(`${API_URL}/api/admin/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!overviewRes.ok) {
      throw new Error(`Overview failed: ${overviewRes.status}`);
    }

    const overview = await overviewRes.json();
    console.log('✅ Overview data:');
    console.log('   Total Users:', overview.kpis.totalUsers);
    console.log('   Total Balance: $' + overview.kpis.totalBalance.toFixed(2));
    console.log('   Deposits Today: $' + overview.kpis.depositsToday.toFixed(2));
    console.log('   Withdrawals Today: $' + overview.kpis.withdrawalsToday.toFixed(2));
    console.log('   Profit Period: $' + overview.kpis.profitPeriod.toFixed(2));
    console.log('   Financial Data Points:', overview.financialData.length);
    console.log('   Geo Data Entries:', overview.geoData.length);
    console.log('');

    // 3. Test Users
    console.log('3️⃣ Testing users endpoint...');
    const usersRes = await fetch(`${API_URL}/api/admin/users?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!usersRes.ok) {
      throw new Error(`Users failed: ${usersRes.status}`);
    }

    const { users, count } = await usersRes.json();
    console.log(`✅ Users data: ${count} users found`);
    if (users.length > 0) {
      console.log('   First user:', users[0].username || users[0].telegramId);
      console.log('   Balance: $' + users[0].balance.toFixed(2));
      console.log('   Plan:', users[0].plan);
    }
    console.log('');

    // 4. Test Deposits
    console.log('4️⃣ Testing deposits endpoint...');
    const depositsRes = await fetch(`${API_URL}/api/admin/deposits?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!depositsRes.ok) {
      throw new Error(`Deposits failed: ${depositsRes.status}`);
    }

    const { deposits } = await depositsRes.json();
    console.log(`✅ Deposits data: ${deposits.length} deposits found`);
    if (deposits.length > 0) {
      console.log('   Latest deposit: $' + deposits[0].amount.toFixed(2));
      console.log('   Status:', deposits[0].status);
      console.log('   Currency:', deposits[0].currency);
    }
    console.log('');

    // 5. Test Withdrawals
    console.log('5️⃣ Testing withdrawals endpoint...');
    const withdrawalsRes = await fetch(`${API_URL}/api/admin/withdrawals?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!withdrawalsRes.ok) {
      throw new Error(`Withdrawals failed: ${withdrawalsRes.status}`);
    }

    const { withdrawals } = await withdrawalsRes.json();
    console.log(`✅ Withdrawals data: ${withdrawals.length} withdrawals found`);
    if (withdrawals.length > 0) {
      console.log('   Latest withdrawal: $' + withdrawals[0].amount.toFixed(2));
      console.log('   Status:', withdrawals[0].status);
      console.log('   Address:', withdrawals[0].address.substring(0, 20) + '...');
    }
    console.log('');

    // 6. Test Expenses
    console.log('6️⃣ Testing expenses endpoint...');
    const expensesRes = await fetch(`${API_URL}/api/admin/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!expensesRes.ok) {
      throw new Error(`Expenses failed: ${expensesRes.status}`);
    }

    const { expenses, totalAmount } = await expensesRes.json();
    console.log(`✅ Expenses data: ${expenses.length} expenses found`);
    console.log('   Total expenses: $' + totalAmount.toFixed(2));
    console.log('');

    // 7. Test Referrals
    console.log('7️⃣ Testing referrals endpoint...');
    const referralsRes = await fetch(`${API_URL}/api/admin/referrals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!referralsRes.ok) {
      throw new Error(`Referrals failed: ${referralsRes.status}`);
    }

    const { referrals } = await referralsRes.json();
    console.log(`✅ Referrals data: ${referrals.length} referrals found`);
    console.log('');

    // Summary
    console.log('🎉 All API endpoints are working correctly!');
    console.log('✅ CRM is connected to real data from the bot');
    console.log('');
    console.log('📊 Summary:');
    console.log('   Users:', count);
    console.log('   Deposits:', deposits.length);
    console.log('   Withdrawals:', withdrawals.length);
    console.log('   Expenses:', expenses.length);
    console.log('   Referrals:', referrals.length);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Tips:');
    console.error('   1. Make sure the bot is running (npm start in telegram-bot)');
    console.error('   2. Check that CRM_ADMIN_* credentials are set in telegram-bot/.env');
    console.error('   3. Verify the password matches the one in .env');
    process.exit(1);
  }
}

testAPI();
