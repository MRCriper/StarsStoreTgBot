# TG Stars Store Bot

Telegram бот для магазина TG Stars с интеграцией Telegram Mini App.

## Описание

Этот проект представляет собой Telegram бота для магазина TG Stars. Бот позволяет пользователям покупать звезды для своего Telegram аккаунта через удобный интерфейс Telegram Mini App.

## Функциональность

- При запуске бота и нажатии на кнопку /start выводится приветственное сообщение со ссылкой на Telegram Mini App
- В Mini App пользователь может ввести свой username и выбрать количество звезд для покупки
- После нажатия на кнопку "Купить" данные отправляются обратно в бота

## Установка и настройка

1. Клонируйте репозиторий:
```
git clone https://github.com/yourusername/StarsStoreTgBot.git
cd StarsStoreTgBot
```

2. Установите зависимости:
```
npm install
```

3. Создайте бота в Telegram через [@BotFather](https://t.me/BotFather) и получите токен

4. Настройте файл `.env`:
```
BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
```

5. В файле `bot.js` замените `your_bot_username` на имя вашего бота:
```javascript
const webAppUrl = `https://t.me/your_bot_username/app`;
```

## Запуск

Для запуска в режиме разработки:
```
npm run dev
```

Для запуска в production:
```
npm start
```

## Технологии

- Node.js
- Express
- node-telegram-bot-api
- Telegram Web App API

## Структура проекта

```
StarsStoreTgBot/
├── .env                # Переменные окружения
├── bot.js              # Логика Telegram бота
├── index.js            # Основной файл для запуска
├── package.json        # Зависимости и скрипты
└── public/             # Файлы для Telegram Mini App
    ├── index.html      # HTML-страница Mini App
    ├── styles.css      # Стили для Mini App
    └── app.js          # JavaScript-логика Mini App
```

## Дальнейшее развитие

- Добавление системы оплаты
- Интеграция с базой данных для хранения информации о пользователях и заказах
- Добавление административной панели для управления магазином
