# Syntrix Platform - Docker Configuration
FROM node:20-alpine

# Установка системных зависимостей для canvas
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    python3 \
    make \
    g++

# Создание рабочей директории
WORKDIR /app

# Копирование package.json
COPY package*.json ./

# Установка concurrently
RUN npm install

# Копирование всех проектов
COPY telegram-bot ./telegram-bot
COPY crm ./crm
COPY landing ./landing
COPY telegram-app ./telegram-app

# Установка зависимостей для всех проектов
WORKDIR /app/telegram-bot
RUN npm install
RUN npx prisma generate

WORKDIR /app/crm
RUN npm install

WORKDIR /app/landing
RUN npm install

WORKDIR /app/telegram-app
RUN npm install

# Сборка всех проектов
WORKDIR /app/telegram-bot
RUN npm run build

WORKDIR /app/crm
RUN npm run build

WORKDIR /app/landing
RUN npm run build

WORKDIR /app/telegram-app
RUN npm run build

# Возврат в корень
WORKDIR /app

# Открытие портов
EXPOSE 3001 3002 3003 3004

# Запуск
CMD ["npm", "start"]
