const Database = require('better-sqlite3')
const db = new Database('./prisma/dev.db')

try {
  console.log('📊 Creating DailyProfitUpdate table...')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS DailyProfitUpdate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      amount REAL NOT NULL,
      timestamp DATETIME NOT NULL,
      dailyTotal REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  console.log('✅ DailyProfitUpdate table created successfully')
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}
