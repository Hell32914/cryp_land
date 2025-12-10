# Card Generation Files

Все файлы, связанные с генерацией торговых карточек для Telegram-бота.

## Основные файлы:

### TypeScript/JavaScript файлы:
- **cardGenerator.ts** - Главный модуль генерации карточек (создание изображения с canvas)
- **cardSettings.ts** - Настройки для генерации и публикации карточек
- **binanceApi.ts** - API для получения данных с Binance и генерации торговых данных
- **tradingCardScheduler.ts** - Планировщик автоматической публикации карточек
- **create-background.js** - Скрипт для создания фонового изображения (card-background.png)
- **create-proper-background.js** - Скрипт для создания улучшенного фона (card_logo3.png)

### Изображения:
- **card_logo3.png** - Основное фоновое изображение для карточек
- **assets/card-background.png** - Альтернативное фоновое изображение

### Шрифты:
- **fonts/arial.ttf** - Шрифт Arial с поддержкой кириллицы

## Зависимости:

Эти файлы используют следующие пакеты:
- canvas - для рисования изображений
- qrcode - для генерации QR-кодов
- @prisma/client - для работы с базой данных
- grammy - для Telegram Bot API

## Использование:

Основная функция экспорта из cardGenerator.ts:
- generateTradingCard() - генерирует изображение торговой карточки
- formatCardCaption() - форматирует подпись для Telegram
- getLastTradingPostData() - получает данные последней опубликованной карточки
