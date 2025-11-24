@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 Syntrix Platform Deployment Script
echo ======================================
echo.

:: Проверка Node.js
echo 📦 Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

:: Проверка npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found
echo.

:: Установка зависимостей
echo 📥 Installing dependencies...
echo Root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

echo Telegram Bot dependencies...
cd telegram-bot
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install telegram-bot dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo CRM dependencies...
cd crm
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install crm dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo Landing dependencies...
cd landing
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install landing dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo Telegram App dependencies...
cd telegram-app
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install telegram-app dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ All dependencies installed
echo.

:: Сборка проектов
echo 🔨 Building projects...

echo Building Telegram Bot...
cd telegram-bot
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build telegram-bot
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building CRM...
cd crm
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build crm
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building Landing...
cd landing
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build landing
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building Telegram App...
cd telegram-app
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build telegram-app
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ All projects built successfully
echo.

:: Запуск сервисов
echo 🚀 Starting all services...
echo.
echo Services will be available at:
echo   - Telegram Bot API: http://localhost:3001
echo   - CRM Admin Panel:  http://localhost:3002
echo   - Landing Page:     http://localhost:3003
echo   - Telegram App:     http://localhost:3004
echo.
echo Press Ctrl+C to stop all services
echo.

call npm start
