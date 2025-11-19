const { execSync } = require('child_process');

console.log('🔄 Initializing database...');

try {
  // Push database schema
  execSync('npx prisma db push --accept-data-loss --skip-generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
