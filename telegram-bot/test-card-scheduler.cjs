// Test card scheduler time conversion
// This script tests the time conversion logic for trading cards

function testTimeConversion() {
  console.log('🧪 Testing Card Scheduler Time Conversion\n')
  
  // Settings: 07:00-23:00 Kyiv time
  const startH = 7, startM = 0
  const endH = 23, endM = 0
  
  const kyivOffset = 2 // UTC+2 (winter time)
  
  // Convert Kyiv time to UTC
  let startMinutesUTC = (startH - kyivOffset) * 60 + startM
  let endMinutesUTC = (endH - kyivOffset) * 60 + endM
  
  console.log('📋 Input Settings:')
  console.log(`   Kyiv time range: ${startH}:${startM.toString().padStart(2, '0')} - ${endH}:${endM.toString().padStart(2, '0')}`)
  console.log()
  
  console.log('🔄 Conversion:')
  console.log(`   Start: ${startH}:00 Kyiv → ${startMinutesUTC / 60}:00 UTC (${startMinutesUTC} minutes)`)
  console.log(`   End: ${endH}:00 Kyiv → ${endMinutesUTC / 60}:00 UTC (${endMinutesUTC} minutes)`)
  console.log()
  
  // Handle day wrap-around
  if (startMinutesUTC < 0) startMinutesUTC += 24 * 60
  if (endMinutesUTC < 0) endMinutesUTC += 24 * 60
  if (startMinutesUTC >= 24 * 60) startMinutesUTC -= 24 * 60
  if (endMinutesUTC >= 24 * 60) endMinutesUTC -= 24 * 60
  
  console.log('✅ Final UTC Range:')
  console.log(`   ${Math.floor(startMinutesUTC / 60)}:${(startMinutesUTC % 60).toString().padStart(2, '0')} UTC - ${Math.floor(endMinutesUTC / 60)}:${(endMinutesUTC % 60).toString().padStart(2, '0')} UTC`)
  console.log()
  
  // Test: Generate 5 random times
  console.log('🎲 Testing Random Time Generation (5 cards):')
  const times = []
  const ranges = endMinutesUTC < startMinutesUTC 
    ? [[startMinutesUTC, 24 * 60 - 1], [0, endMinutesUTC]]
    : [[startMinutesUTC, endMinutesUTC]]
  
  console.log(`   Time ranges: ${JSON.stringify(ranges)}`)
  
  for (let i = 0; i < 5; i++) {
    const range = ranges[Math.floor(Math.random() * ranges.length)]
    const randomMinutes = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
    times.push(randomMinutes % (24 * 60))
  }
  
  times.sort((a, b) => a - b)
  
  console.log('\n   Generated times:')
  times.forEach((minutes, i) => {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    const utcTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    const kyivHours = (hours + 2) % 24
    const kyivTime = `${kyivHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    console.log(`   ${i + 1}. ${utcTime} UTC → ${kyivTime} Kyiv`)
  })
  
  console.log('\n✅ Test completed!')
}

// Test scheduling logic
function testSchedulingLogic() {
  console.log('\n\n🧪 Testing Scheduling Logic\n')
  
  const now = new Date()
  console.log(`⏰ Current time: ${now.toISOString()}`)
  console.log(`   UTC: ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`)
  
  // Simulate a scheduled time that already passed
  const pastTime = new Date(now)
  pastTime.setUTCHours(now.getUTCHours() - 2)
  
  console.log(`\n📋 Test Case 1: Time already passed today`)
  console.log(`   Target: ${pastTime.getUTCHours()}:00 UTC`)
  
  let targetTime = new Date(now)
  targetTime.setUTCHours(pastTime.getUTCHours(), 0, 0, 0)
  
  if (targetTime.getTime() <= now.getTime()) {
    targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000)
    console.log(`   ✅ Scheduled for tomorrow: ${targetTime.toISOString()}`)
  } else {
    console.log(`   ✅ Scheduled for today: ${targetTime.toISOString()}`)
  }
  
  // Simulate a future time
  const futureTime = new Date(now)
  futureTime.setUTCHours(now.getUTCHours() + 2)
  
  console.log(`\n📋 Test Case 2: Future time today`)
  console.log(`   Target: ${futureTime.getUTCHours()}:00 UTC`)
  
  targetTime = new Date(now)
  targetTime.setUTCHours(futureTime.getUTCHours(), 0, 0, 0)
  
  if (targetTime.getTime() <= now.getTime()) {
    targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000)
    console.log(`   ✅ Scheduled for tomorrow: ${targetTime.toISOString()}`)
  } else {
    console.log(`   ✅ Scheduled for today: ${targetTime.toISOString()}`)
    const delayMinutes = Math.round((targetTime.getTime() - now.getTime()) / 1000 / 60)
    console.log(`   ⏱️  Delay: ${delayMinutes} minutes`)
  }
  
  console.log('\n✅ Test completed!')
}

// Run tests
testTimeConversion()
testSchedulingLogic()
