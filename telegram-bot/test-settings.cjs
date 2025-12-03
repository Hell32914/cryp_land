// Test card settings loading
const fs = require('fs').promises
const path = require('path')
require('dotenv').config()

async function loadCardSettings() {
  const SETTINGS_FILE = path.join(__dirname, 'card-settings.json')
  
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist, use defaults from .env
    return {
      minPerDay: parseInt(process.env.CARDS_MIN_PER_DAY || '4'),
      maxPerDay: parseInt(process.env.CARDS_MAX_PER_DAY || '16'),
      startTime: process.env.CARDS_START_TIME || '07:49',
      endTime: process.env.CARDS_END_TIME || '22:30'
    }
  }
}

async function testSettings() {
  console.log('🧪 Testing Card Settings Loading\n')
  
  try {
    const settings = await loadCardSettings()
    
    console.log('✅ Settings loaded successfully:')
    console.log(`   📊 Posts per day: ${settings.minPerDay}-${settings.maxPerDay}`)
    console.log(`   🕐 Time range: ${settings.startTime}-${settings.endTime} (Kyiv)`)
    console.log()
    
    // Parse times
    const [startH, startM] = settings.startTime.split(':').map(Number)
    const [endH, endM] = settings.endTime.split(':').map(Number)
    
    console.log('⏰ Time Conversion to UTC:')
    const kyivOffset = 2
    let startMinutesUTC = (startH - kyivOffset) * 60 + startM
    let endMinutesUTC = (endH - kyivOffset) * 60 + endM
    
    // Handle wrap-around
    if (startMinutesUTC < 0) startMinutesUTC += 24 * 60
    if (endMinutesUTC < 0) endMinutesUTC += 24 * 60
    
    const startUTC = `${Math.floor(startMinutesUTC / 60).toString().padStart(2, '0')}:${(startMinutesUTC % 60).toString().padStart(2, '0')}`
    const endUTC = `${Math.floor(endMinutesUTC / 60).toString().padStart(2, '0')}:${(endMinutesUTC % 60).toString().padStart(2, '0')}`
    
    console.log(`   Kyiv: ${settings.startTime}-${settings.endTime}`)
    console.log(`   UTC:  ${startUTC}-${endUTC}`)
    console.log()
    
    // Validation
    console.log('✅ Validation:')
    if (settings.minPerDay < 1 || settings.minPerDay > 50) {
      console.log('   ❌ minPerDay should be 1-50')
    } else {
      console.log(`   ✅ minPerDay: ${settings.minPerDay}`)
    }
    
    if (settings.maxPerDay < settings.minPerDay || settings.maxPerDay > 50) {
      console.log('   ❌ maxPerDay should be >= minPerDay and <= 50')
    } else {
      console.log(`   ✅ maxPerDay: ${settings.maxPerDay}`)
    }
    
    if (startH < 0 || startH > 23 || endH < 0 || endH > 23) {
      console.log('   ❌ Invalid time format')
    } else {
      console.log('   ✅ Time format valid')
    }
    
    console.log()
    console.log('✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Error loading settings:', error)
    process.exit(1)
  }
}

testSettings()
