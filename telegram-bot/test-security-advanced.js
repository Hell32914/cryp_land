/**
 * Advanced Security Testing Script
 * Продвинутые тесты безопасности с реальными токенами
 * 
 * Требуется: настроенная база данных и работающий API
 * Запуск: node test-security-advanced.js
 */

import axios from 'axios'
import jwt from 'jsonwebtoken'

const API_URL = process.env.API_URL || 'http://localhost:3000'
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'your-secret-key'
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

// Генерация тестовых JWT токенов
function generateToken(telegramId) {
  return jwt.sign({ telegramId }, USER_JWT_SECRET, { expiresIn: '1h' })
}

async function testCrossuserWithdrawal() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Попытка вывода средств с чужого аккаунта')
  console.log('='.repeat(60))
  
  const attackerTelegramId = '111111111'
  const victimTelegramId = '999999999'
  
  // Токен атакующего
  const attackerToken = generateToken(attackerTelegramId)
  
  log('blue', 'ℹ️', `Атакующий: ${attackerTelegramId}`)
  log('blue', 'ℹ️', `Жертва: ${victimTelegramId}`)
  log('blue', 'ℹ️', 'Попытка создать вывод на адрес жертвы с токеном атакующего...')
  
  try {
    const response = await axios.post(
      `${API_URL}/api/user/${victimTelegramId}/create-withdrawal`,
      {
        amount: 100,
        currency: 'USDT',
        address: 'TAttackerAddress123',
        network: 'TRC20'
      },
      {
        headers: { 'Authorization': `Bearer ${attackerToken}` },
        validateStatus: () => true
      }
    )
    
    if (response.status === 403) {
      log('green', '✅', `ЗАЩИТА РАБОТАЕТ! Получен 403 Forbidden`)
      log('green', '  ', `Сообщение: ${response.data.error}`)
    } else if (response.status === 404) {
      log('green', '✅', 'Пользователь не найден (но токен был проверен)')
    } else if (response.status === 401) {
      log('green', '✅', 'Требуется аутентификация')
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Статус: ${response.status}`)
      log('red', '  ', `Данные: ${JSON.stringify(response.data)}`)
    }
  } catch (error) {
    if (error.response?.status === 403) {
      log('green', '✅', 'ЗАЩИТА РАБОТАЕТ! 403 Forbidden')
    } else {
      log('yellow', '⚠️', `Ошибка: ${error.message}`)
    }
  }
}

async function testCrossuserDataAccess() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Попытка доступа к данным чужого пользователя')
  console.log('='.repeat(60))
  
  const attackerTelegramId = '111111111'
  const victimTelegramId = '999999999'
  const attackerToken = generateToken(attackerTelegramId)
  
  const endpoints = [
    '/api/user/{id}',
    '/api/user/{id}/notifications',
    '/api/user/{id}/referrals',
    '/api/user/{id}/transactions',
    '/api/user/{id}/daily-updates'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const url = endpoint.replace('{id}', victimTelegramId)
      const response = await axios.get(
        `${API_URL}${url}`,
        {
          headers: { 'Authorization': `Bearer ${attackerToken}` },
          validateStatus: () => true
        }
      )
      
      if (response.status === 403 || response.status === 401) {
        log('green', '✅', `${endpoint}: Защищено (${response.status})`)
      } else if (response.status === 404) {
        log('green', '✅', `${endpoint}: Пользователь не найден (токен проверен)`)
      } else {
        log('red', '❌', `${endpoint}: УЯЗВИМОСТЬ! Статус ${response.status}`)
      }
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        log('green', '✅', `${endpoint}: Защищено`)
      } else {
        log('yellow', '⚠️', `${endpoint}: ${error.message}`)
      }
    }
  }
}

async function testDoubleSpending() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Защита от двойного списания (race condition)')
  console.log('='.repeat(60))
  
  const telegramId = '111111111'
  const token = generateToken(telegramId)
  
  log('blue', 'ℹ️', 'Отправка 5 одинаковых запросов на вывод одновременно...')
  
  const withdrawalData = {
    amount: 50,
    currency: 'USDT',
    address: 'TTestAddress123',
    network: 'TRC20'
  }
  
  const requests = Array(5).fill(null).map(() => 
    axios.post(
      `${API_URL}/api/user/${telegramId}/create-withdrawal`,
      withdrawalData,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true
      }
    )
  )
  
  try {
    const responses = await Promise.all(requests)
    const successCount = responses.filter(r => r.status === 200 || r.status === 201).length
    const blockedCount = responses.filter(r => r.status === 429).length
    
    if (successCount <= 1 && blockedCount >= 4) {
      log('green', '✅', `ЗАЩИТА РАБОТАЕТ! Успешно: ${successCount}, Заблокировано: ${blockedCount}`)
    } else if (successCount === 0) {
      log('green', '✅', `Все запросы отклонены (возможно недостаточно средств)`)
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Успешно обработано: ${successCount} запросов`)
    }
  } catch (error) {
    log('yellow', '⚠️', `Ошибка при тестировании: ${error.message}`)
  }
}

async function testExpiredToken() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Попытка использования просроченного токена')
  console.log('='.repeat(60))
  
  // Создаем токен который уже просрочен
  const expiredToken = jwt.sign(
    { telegramId: '111111111' },
    USER_JWT_SECRET,
    { expiresIn: '-1h' } // Просрочен час назад
  )
  
  try {
    const response = await axios.get(
      `${API_URL}/api/user/111111111`,
      {
        headers: { 'Authorization': `Bearer ${expiredToken}` },
        validateStatus: () => true
      }
    )
    
    if (response.status === 401) {
      log('green', '✅', 'ЗАЩИТА РАБОТАЕТ! Просроченный токен отклонен')
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Просроченный токен принят, статус: ${response.status}`)
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('green', '✅', 'Просроченный токен отклонен')
    } else {
      log('yellow', '⚠️', `Ошибка: ${error.message}`)
    }
  }
}

async function testInvalidToken() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST: Попытка использования поддельного токена')
  console.log('='.repeat(60))
  
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZWxlZ3JhbUlkIjoiMTIzNDU2Nzg5In0.InvalidSignature'
  
  try {
    const response = await axios.get(
      `${API_URL}/api/user/123456789`,
      {
        headers: { 'Authorization': `Bearer ${fakeToken}` },
        validateStatus: () => true
      }
    )
    
    if (response.status === 401) {
      log('green', '✅', 'ЗАЩИТА РАБОТАЕТ! Поддельный токен отклонен')
    } else {
      log('red', '❌', `УЯЗВИМОСТЬ! Поддельный токен принят, статус: ${response.status}`)
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('green', '✅', 'Поддельный токен отклонен')
    } else {
      log('yellow', '⚠️', `Ошибка: ${error.message}`)
    }
  }
}

async function runAllTests() {
  console.log(`\n${'='.repeat(60)}`)
  console.log('🔒 ПРОДВИНУТОЕ ТЕСТИРОВАНИЕ БЕЗОПАСНОСТИ')
  console.log(`${'='.repeat(60)}`)
  log('blue', 'ℹ️', `API URL: ${API_URL}`)
  log('yellow', '⚠️', 'Убедитесь что USER_JWT_SECRET установлен в .env\n')
  
  if (USER_JWT_SECRET === 'your-secret-key') {
    log('red', '❌', 'ВНИМАНИЕ! Используется дефолтный JWT секрет!')
    log('yellow', '⚠️', 'Установите переменную USER_JWT_SECRET в .env файле')
  }
  
  await testCrossuserWithdrawal()
  await testCrossuserDataAccess()
  await testDoubleSpending()
  await testExpiredToken()
  await testInvalidToken()
  
  console.log(`\n${'='.repeat(60)}`)
  log('green', '✅', 'ТЕСТИРОВАНИЕ ЗАВЕРШЕНО')
  console.log(`${'='.repeat(60)}\n`)
}

runAllTests()
