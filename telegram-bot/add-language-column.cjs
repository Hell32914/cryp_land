const Database = require('better-sqlite3');
const db = new Database('./dev.db');

try {
  // Add languageCode column to User table
  db.exec('ALTER TABLE User ADD COLUMN languageCode TEXT');
  console.log('✅ Added languageCode column to User table');
} catch (error) {
  if (error.message.includes('duplicate column')) {
    console.log('ℹ️ Column languageCode already exists');
  } else {
    console.error('Error:', error.message);
  }
}

db.close();
