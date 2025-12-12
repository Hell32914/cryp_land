/**
 * Security Testing Script
 * Проверка исправленных уязвимостей безопасности
 * 
 * Запуск: node test-security.js
 */

import axios from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:3000'
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
}

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`)
}

async function testUnauthorizedAccess() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 1: Попытка доступа без токена')
  console.log('='.repeat(60))
  
  const tests = [
    { endpoint: '/api/user/123456789', method: 'GET', description: 'Получение данных пользователя' },
    { endpoint: '/api/user/123456789/create-withdrawal', method: 'POST', description: 'Создание вывода' },
    { endpoint: '/api/user/123456789/reinvest', method: 'POST', description: 'Реинвест' },
    { endpoint: '/api/user/123456789/create-deposit', method: 'POST', description: 'Создание депозита' }
  ]
  
  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method.toLowerCase(),
        url: `${API_URL}${test.endpoint}`,
        validateStatus: () => true
      })
      
      if (response.status === 401) {
        log('green', '✅', `${test.description}: Защищено (401 Unauthorized)`)
      } else {
        log('red', '❌', `${test.description}: УЯЗВИМОСТЬ! Получен статус ${response.status}`)
      }
    } catch (error) {
      log('yellow', '⚠️', `${test.description}: Ошибка подключения - ${error.message}`)
    }
  }
}

async function testTokenMismatch() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 2: Попытка доступа с токеном одного пользователя к данным другого')
  console.log('='.repeat(60))
  
  log('blue', 'ℹ️', 'Для этого теста нужен реальный JWT токен')
  log('blue', 'ℹ️', 'Получите токен через /api/user/auth с telegramId=111111111')
  
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZWxlZ3JhbUlkIjoiMTExMTExMTExIiwiaWF0IjoxNzAwMDAwMDAwfQ.fake'
  const targetUserId = '999999999' // Другой пользователь
  
  try {
    const response = await axios({
      method: 'get',
      url: `${API_URL}/api/user/${targetUserId}`,
      headers: {
        'Authorization': `Bearer ${fakeToken}`
      },
      validateStatus: () => true
    })
    
    if (response.status === 401 || response.status === 403) {
      log('green', '✅', `Защита работает: ${response.status} ${response.data.error || ''}`)
    } else if (response.status === 404) {
      log('green', '✅', 'Пользователь не найден (токен проверен)')
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Получен доступ со статусом ${response.status}`)
    }
  } catch (error) {
    if (error.response?.status === 403) {
      log('green', '✅', 'Защита работает: 403 Forbidden (telegramId mismatch)')
    } else {
      log('yellow', '⚠️', `Ошибка: ${error.message}`)
    }
  }
}

async function testOxaPayCallback() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 3: Попытка подделки OxaPay callback')
  console.log('='.repeat(60))
  
  const fakeCallbacks = [
    {
      name: 'Без trackId',
      data: { status: 'Paid', amount: 1000 }
    },
    {
      name: 'С несуществующим trackId',
      data: { trackId: 'fake-track-id-12345', status: 'Paid', amount: 1000 }
    },
    {
      name: 'С неверной суммой',
      data: { trackId: 'real-track-id', status: 'Paid', amount: 999999 }
    }
  ]
  
  for (const test of fakeCallbacks) {
    try {
      const response = await axios.post(
        `${API_URL}/api/oxapay-callback`,
        test.data,
        { validateStatus: () => true }
      )
      
      if (response.status === 400 || (response.data && !response.data.success)) {
        log('green', '✅', `${test.name}: Заблокировано`)
      } else {
        log('red', '❌', `${test.name}: УЯЗВИМОСТЬ! Статус ${response.status}`)
      }
    } catch (error) {
      log('yellow', '⚠️', `${test.name}: Ошибка - ${error.message}`)
    }
  }
}

async function testWebhook() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 4: Проверка защиты Telegram Webhook')
  console.log('='.repeat(60))
  
  try {
    const response = await axios.post(
      `${API_URL}/webhook`,
      { update_id: 12345, message: { text: 'test' } },
      { 
        headers: { 'x-telegram-bot-api-secret-token': 'wrong-token' },
        validateStatus: () => true
      }
    )
    
    if (response.status === 401) {
      log('green', '✅', 'Webhook защищен: 401 Unauthorized при неверном токене')
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Webhook принял запрос со статусом ${response.status}`)
    }
  } catch (error) {
    log('yellow', '⚠️', `Ошибка подключения: ${error.message}`)
  }
}

async function testAdminEndpoint() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 5: Попытка доступа к админ эндпоинту без авторизации')
  console.log('='.repeat(60))
  
  try {
    const response = await axios.patch(
      `${API_URL}/api/admin/marketing-links/test-link-id/traffic-cost`,
      { trafficCost: 999 },
      { validateStatus: () => true }
    )
    
    if (response.status === 401 || response.status === 503) {
      log('green', '✅', `Админ эндпоинт защищен: ${response.status}`)
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Получен доступ со статусом ${response.status}`)
    }
  } catch (error) {
    log('yellow', '⚠️', `Ошибка: ${error.message}`)
  }
}

async function runAllTests() {
  console.log(`\n${'='.repeat(60)}`)
  console.log('🔒 ТЕСТИРОВАНИЕ БЕЗОПАСНОСТИ SYNTRIX API')
  console.log(`${'='.repeat(60)}`)
  log('blue', 'ℹ️', `API URL: ${API_URL}`)
  log('blue', 'ℹ️', 'Убедитесь что сервер запущен перед тестированием\n')
  
  try {
    await testUnauthorizedAccess()
    await testTokenMismatch()
    await testOxaPayCallback()
    await testWebhook()
    await testAdminEndpoint()
    
    console.log(`\n${'='.repeat(60)}`)
    log('green', '✅', 'ТЕСТИРОВАНИЕ ЗАВЕРШЕНО')
    console.log(`${'='.repeat(60)}\n`)
    
    log('blue', 'ℹ️', 'Если все тесты показали ✅ - защита работает корректно!')
    log('yellow', '⚠️', 'Если есть ❌ - требуется дополнительная проверка и исправления')
    
  } catch (error) {
    log('red', '❌', `Критическая ошибка: ${error.message}`)
    process.exit(1)
  }
}

// Запуск тестов
runAllTests()
