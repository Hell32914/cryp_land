#!/bin/bash

echo "🚀 Syntrix Platform Deployment Script"
echo "======================================"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка Node.js
echo -e "${YELLOW}📦 Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"
echo ""

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) found${NC}"
echo ""

# Установка зависимостей
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
echo "Root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

echo "Telegram Bot dependencies..."
cd telegram-bot && npm install && cd ..
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install telegram-bot dependencies${NC}"
    exit 1
fi

echo "CRM dependencies..."
cd crm && npm install && cd ..
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install crm dependencies${NC}"
    exit 1
fi

echo "Landing dependencies..."
cd landing && npm install && cd ..
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install landing dependencies${NC}"
    exit 1
fi

echo "Telegram App dependencies..."
cd telegram-app && npm install && cd ..
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install telegram-app dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies installed${NC}"
echo ""

# Сборка проектов
echo -e "${YELLOW}🔨 Building projects...${NC}"

echo "Building Telegram Bot..."
cd telegram-bot && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build telegram-bot${NC}"
    exit 1
fi
cd ..

echo "Building CRM..."
cd crm && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build crm${NC}"
    exit 1
fi
cd ..

echo "Building Landing..."
cd landing && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build landing${NC}"
    exit 1
fi
cd ..

echo "Building Telegram App..."
cd telegram-app && npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build telegram-app${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ All projects built successfully${NC}"
echo ""

# Запуск сервисов
echo -e "${YELLOW}🚀 Starting all services...${NC}"
echo ""
echo "Services will be available at:"
echo "  - Telegram Bot API: http://localhost:3001"
echo "  - CRM Admin Panel:  http://localhost:3002"
echo "  - Landing Page:     http://localhost:3003"
echo "  - Telegram App:     http://localhost:3004"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

npm start
