#!/bin/bash

echo "🔧 Syntrix Platform - Server Setup Script"
echo "=========================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Обновление системы
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Установка Node.js
echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"
echo -e "${GREEN}✅ npm $(npm -v) installed${NC}"

# Установка Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt install -y nginx

# Установка Certbot для SSL
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Установка PM2 (альтернатива systemd)
echo -e "${YELLOW}📦 Installing PM2...${NC}"
npm install -g pm2

# Копирование Nginx конфигурации
echo -e "${YELLOW}🔧 Setting up Nginx...${NC}"
if [ -f "./nginx.conf" ]; then
    cp nginx.conf /etc/nginx/sites-available/syntrix
    ln -sf /etc/nginx/sites-available/syntrix /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Проверка конфигурации
    nginx -t
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        echo -e "${GREEN}✅ Nginx configured${NC}"
    else
        echo -e "${RED}❌ Nginx configuration error${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nginx.conf not found, skipping${NC}"
fi

# Настройка Firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # Bot API (если нужен прямой доступ)
ufw --force enable

echo -e "${GREEN}✅ Firewall configured${NC}"

# Копирование systemd service
echo -e "${YELLOW}🔧 Setting up systemd service...${NC}"
if [ -f "./syntrix.service" ]; then
    # Получение текущей директории
    CURRENT_DIR=$(pwd)
    
    # Обновление пути в service файле
    sed -i "s|WorkingDirectory=.*|WorkingDirectory=$CURRENT_DIR|" syntrix.service
    sed -i "s|User=.*|User=$SUDO_USER|" syntrix.service
    sed -i "s|Group=.*|Group=$SUDO_USER|" syntrix.service
    
    cp syntrix.service /etc/systemd/system/
    systemctl daemon-reload
    
    echo -e "${GREEN}✅ Systemd service installed${NC}"
    echo -e "${BLUE}To enable: sudo systemctl enable syntrix${NC}"
    echo -e "${BLUE}To start: sudo systemctl start syntrix${NC}"
else
    echo -e "${YELLOW}⚠️  syntrix.service not found, skipping${NC}"
fi

# Создание .env если не существует
echo -e "${YELLOW}🔧 Checking environment variables...${NC}"
if [ ! -f "./telegram-bot/.env" ]; then
    if [ -f "./.env.example" ]; then
        cp .env.example telegram-bot/.env
        echo -e "${YELLOW}⚠️  Created telegram-bot/.env from example${NC}"
        echo -e "${RED}❗ IMPORTANT: Edit telegram-bot/.env with your credentials!${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Информация о следующих шагах
echo ""
echo -e "${GREEN}✅ Server setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo ""
echo "1. Edit environment variables:"
echo "   nano telegram-bot/.env"
echo ""
echo "2. Setup SSL certificates:"
echo "   sudo certbot --nginx -d syntrix.cc -d www.syntrix.cc"
echo "   sudo certbot --nginx -d api.syntrix.cc"
echo "   sudo certbot --nginx -d admin.syntrix.cc"
echo "   sudo certbot --nginx -d app.syntrix.cc"
echo ""
echo "3. Deploy the application:"
echo "   ./deploy.sh"
echo ""
echo "4. Enable autostart:"
echo "   sudo systemctl enable syntrix"
echo "   sudo systemctl start syntrix"
echo ""
echo "5. Check status:"
echo "   sudo systemctl status syntrix"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "   sudo journalctl -u syntrix -f"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"
