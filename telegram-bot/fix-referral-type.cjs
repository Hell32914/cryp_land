const Database = require('better-sqlite3')
const db = new Database('./prisma/dev.db')

try {
  console.log('🔧 Fixing referredUserId column type...')
  
  // Create new table with correct type
  db.exec(`
    CREATE TABLE IF NOT EXISTS Referral_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      referredUserId INTEGER NOT NULL,
      referredUsername TEXT,
      level INTEGER NOT NULL,
      earnings REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    )
  `)
  
  // Copy data if old table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Referral'").get()
  
  if (tableExists) {
    console.log('📦 Copying existing referral data...')
    db.exec(`
      INSERT INTO Referral_new (id, userId, referredUserId, referredUsername, level, earnings, createdAt)
      SELECT id, userId, CAST(referredUserId AS INTEGER), referredUsername, level, earnings, createdAt
      FROM Referral
    `)
    
    // Drop old table
    db.exec('DROP TABLE Referral')
  }
  
  // Rename new table
  db.exec('ALTER TABLE Referral_new RENAME TO Referral')
  
  console.log('✅ Successfully fixed referredUserId type to INTEGER')
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}
