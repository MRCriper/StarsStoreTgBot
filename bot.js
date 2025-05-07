const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = `https://4008db5c-30f4-4c1f-9e72-9277a9789452-00-3dj86x3mdpb5x.sisko.replit.dev/`;
  
  // Создаем клавиатуру с кнопкой для открытия Mini App
  const keyboard = {
    inline_keyboard: [
      [{ text: '🌟 Открыть магазин звезд', web_app: { url: webAppUrl } }]
    ]
  };
  
  // Отправляем приветственное сообщение с клавиатурой
  bot.sendMessage(
    chatId,
    `*Добро пожаловать в TG Stars Store!* 🌟\n\nУ нас вы можете приобрести премиум звезды для вашего Telegram аккаунта.\n\nНажмите на кнопку ниже, чтобы открыть магазин и выбрать подходящий пакет.`,
    { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    }
  );
});

// Обработчик для получения данных из Mini App
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app_data.data);
  
  // Форматирование цены
  const formattedPrice = typeof data.price === 'number' 
    ? data.price.toFixed(2).replace(/\.00$/, '') 
    : data.price.toString().replace(/\.00$/, '');
  
  // Создаем красивое сообщение о заказе
  const orderMessage = `
✅ *Заказ успешно оформлен!*

📦 *Детали заказа:*
👤 Пользователь: \`${data.username}\`
⭐ Количество звезд: *${data.stars}*
💰 Стоимость: *${formattedPrice} ₽*

🕒 Звезды будут добавлены на ваш аккаунт в течение 24 часов.

*Спасибо за покупку в TG Stars Store!* 🌟
`;

  // Отправляем сообщение о заказе
  bot.sendMessage(chatId, orderMessage, { parse_mode: 'Markdown' });
  
  // Отправляем стикер с благодарностью
  setTimeout(() => {
    bot.sendSticker(chatId, 'CAACAgIAAxkBAAELCmJlYWFiX1KAAh1Yd-KrCenN4HQj5QACbAADFkJrCmQVf98V_NMvMwQ');
  }, 1000);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
*Помощь по использованию TG Stars Store* 🌟

*Основные команды:*
/start - Начать работу с ботом
/help - Показать это сообщение
/about - Информация о магазине

*Как купить звезды:*
1. Нажмите на кнопку "Открыть магазин звезд"
2. Выберите готовый пакет или укажите своё количество звезд
3. Введите ваш username (без символа @)
4. Нажмите кнопку "Оплатить"

*Вопросы и поддержка:*
Если у вас возникли вопросы или проблемы, пожалуйста, напишите нам: @support_stars_store
`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Обработчик команды /about
bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  
  const aboutMessage = `
*О магазине TG Stars Store* 🌟

TG Stars Store - это официальный магазин премиум звезд для вашего Telegram аккаунта.

*Наши преимущества:*
✅ Быстрая доставка звезд
✅ Выгодные цены и скидки
✅ Круглосуточная поддержка
✅ 100% гарантия качества

*Контакты:*
📧 Email: support@tgstars.store
👨‍💻 Поддержка: @support_stars_store
🌐 Веб-сайт: tgstars.store

*© 2025 TG Stars Store*
`;

  bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
});

// Обработчик для неизвестных команд
bot.on('message', (msg) => {
  // Проверяем, что это не команда и не данные из веб-приложения
  if (!msg.text || !msg.text.startsWith('/') && !msg.web_app_data) {
    const chatId = msg.chat.id;
    const webAppUrl = `http://localhost:3000`;
    
    // Создаем клавиатуру с кнопкой для открытия Mini App
    const keyboard = {
      inline_keyboard: [
        [{ text: '🌟 Открыть магазин звезд', web_app: { url: webAppUrl } }]
      ]
    };
    
    // Отправляем сообщение с предложением открыть магазин
    bot.sendMessage(
      chatId,
      'Чтобы купить звезды, нажмите на кнопку ниже и откройте наш магазин.',
      { reply_markup: keyboard }
    );
  }
});

console.log('Бот запущен!');

module.exports = bot;
