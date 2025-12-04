// Check admin IDs configuration
require('dotenv').config()

console.log('🔍 Checking Admin Configuration\n')

const ADMIN_IDS_STRING = process.env.ADMIN_IDS || process.env.ADMIN_ID || ''
const ADMIN_IDS = ADMIN_IDS_STRING.split(',').map(id => id.trim()).filter(id => id.length > 0)

console.log('📋 Environment Variables:')
console.log(`   ADMIN_IDS (raw): "${process.env.ADMIN_IDS}"`)
console.log(`   ADMIN_ID (legacy): "${process.env.ADMIN_ID}"`)
console.log()

console.log('✅ Parsed Admin IDs:')
ADMIN_IDS.forEach((id, index) => {
  console.log(`   ${index + 1}. ${id}`)
})
console.log()

console.log('🧪 Testing Admin Check:')
const testIds = ['8574768354', '503856039', '123456789']
testIds.forEach(testId => {
  const isAdmin = ADMIN_IDS.includes(testId)
  console.log(`   ${testId}: ${isAdmin ? '✅ Admin' : '❌ Not Admin'}`)
})
console.log()

if (ADMIN_IDS.length === 0) {
  console.log('⚠️  WARNING: No admin IDs configured!')
  console.log('   Please set ADMIN_IDS in .env file')
} else {
  console.log(`✅ Total admins configured: ${ADMIN_IDS.length}`)
}
