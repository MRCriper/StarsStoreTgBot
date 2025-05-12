const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Путь к файлу с данными рефералов
const REFERRALS_DATA_PATH = path.join(__dirname, 'referrals-data.json');
const DISCOUNTS_DATA_PATH = path.join(__dirname, 'discounts-data.json');

// Функция для загрузки данных рефералов
function loadReferralsData() {
  try {
    if (fs.existsSync(REFERRALS_DATA_PATH)) {
      const data = fs.readFileSync(REFERRALS_DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Ошибка при загрузке данных рефералов:', error);
    return {};
  }
}

// Функция для сохранения данных рефералов
function saveReferralsData(data) {
  try {
    fs.writeFileSync(REFERRALS_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка при сохранении данных рефералов:', error);
  }
}

// Функция для загрузки данных скидок
function loadDiscountsData() {
  try {
    if (fs.existsSync(DISCOUNTS_DATA_PATH)) {
      const data = fs.readFileSync(DISCOUNTS_DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Ошибка при загрузке данных скидок:', error);
    return {};
  }
}

// Функция для сохранения данных скидок
function saveDiscountsData(data) {
  try {
    fs.writeFileSync(DISCOUNTS_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка при сохранении данных скидок:', error);
  }
}

// Функция для добавления реферала
function addReferral(referrerId, referralId, referralUsername) {
  try {
    // Загружаем данные рефералов
    const referralsData = loadReferralsData();
    
    // Получаем данные реферера или создаем новую запись
    const referrerData = referralsData[referrerId] || {
      userId: referrerId,
      referrals: [],
      totalReferralStars: 0
    };
    
    // Проверяем, есть ли уже такой реферал
    const existingReferral = referrerData.referrals.find(ref => ref.userId === referralId);
    
    if (!existingReferral) {
      // Добавляем нового реферала
      referrerData.referrals.push({
        userId: referralId,
        username: referralUsername,
        joinDate: new Date().toISOString(),
        totalStarsPurchased: 0
      });
      
      // Обновляем данные реферера
      referralsData[referrerId] = referrerData;
      
      // Сохраняем обновленные данные
      saveReferralsData(referralsData);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка при добавлении реферала:', error);
    return false;
  }
}

// Функция для обновления количества купленных звезд реферала
function updateReferralStars(referrerId, referralId, stars) {
  try {
    // Загружаем данные рефералов
    const referralsData = loadReferralsData();
    
    // Получаем данные реферера
    const referrerData = referralsData[referrerId];
    
    if (!referrerData) {
      return false;
    }
    
    // Находим реферала
    const referralIndex = referrerData.referrals.findIndex(ref => ref.userId === referralId);
    
    if (referralIndex === -1) {
      return false;
    }
    
    // Обновляем количество купленных звезд
    const previousStars = referrerData.referrals[referralIndex].totalStarsPurchased;
    referrerData.referrals[referralIndex].totalStarsPurchased += stars;
    
    // Обновляем общее количество звезд
    referrerData.totalReferralStars += stars;
    
    // Сохраняем обновленные данные
    referralsData[referrerId] = referrerData;
    saveReferralsData(referralsData);
    
    // Проверяем, нужно ли начислить новые скидки
    const previousDiscounts = Math.floor(previousStars / 100);
    const currentDiscounts = Math.floor(referrerData.referrals[referralIndex].totalStarsPurchased / 100);
    
    if (currentDiscounts > previousDiscounts) {
      // Начисляем новые скидки
      const newDiscounts = currentDiscounts - previousDiscounts;
      addDiscounts(referrerId, newDiscounts);
      
      return {
        success: true,
        newDiscounts: newDiscounts
      };
    }
    
    return {
      success: true,
      newDiscounts: 0
    };
  } catch (error) {
    console.error('Ошибка при обновлении звезд реферала:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Функция для добавления скидок
function addDiscounts(userId, count) {
  try {
    // Загружаем данные скидок
    const discountsData = loadDiscountsData();
    
    // Получаем данные пользователя или создаем новую запись
    const userDiscounts = discountsData[userId] || {
      userId: userId,
      discounts: [],
      appliedDiscounts: []
    };
    
    // Добавляем новые скидки
    for (let i = 0; i < count; i++) {
      userDiscounts.discounts.push({
        percent: 5,
        reason: i === 0 ? 'Рефералы купили 100 звёзд' : 'Рефералы купили ещё 100 звёзд',
        createdAt: new Date().toISOString()
      });
    }
    
    // Обновляем данные пользователя
    discountsData[userId] = userDiscounts;
    
    // Сохраняем обновленные данные
    saveDiscountsData(discountsData);
    
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении скидок:', error);
    return false;
  }
}

// Функция для получения реферера из реферальной ссылки
function getReferrerFromStartParam(startParam) {
  if (!startParam || !startParam.startsWith('ref_')) {
    return null;
  }
  
  return startParam.substring(4);
}

// Обработчик команды /start
bot.onText(/\/start(.*)/, (msg, match) => {
  const chatId = msg.chat.id;
  const webAppUrl = `https://4008db5c-30f4-4c1f-9e72-9277a9789452-00-3dj86x3mdpb5x.sisko.replit.dev/`;
  
  // Получаем параметр из команды /start
  const startParam = match[1] ? match[1].trim() : null;
  
  // Проверяем, является ли это реферальной ссылкой
  if (startParam) {
    const referrerId = getReferrerFromStartParam(startParam);
    
    if (referrerId) {
      // Добавляем пользователя как реферала
      const referralId = msg.from.id.toString();
      const referralUsername = msg.from.username || `user${referralId}`;
      
      // Проверяем, что реферер и реферал - разные пользователи
      if (referrerId !== referralId) {
        const added = addReferral(referrerId, referralId, referralUsername);
        
        if (added) {
          // Отправляем сообщение о успешном добавлении реферала
          bot.sendMessage(
            referrerId,
            `🎉 *Поздравляем!* У вас новый реферал: ${msg.from.username ? '@' + msg.from.username : 'Пользователь'}.\n\nКогда реферал купит звезды, вы получите скидку 5% за каждые 100 купленных им звезд.`,
            { parse_mode: 'Markdown' }
          );
        }
      }
    }
  }
  
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
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app_data.data);
  
  // Генерируем уникальный ID заказа
  const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Проверяем, есть ли у пользователя скидки
  const userId = msg.from.id.toString();
  const discountsData = loadDiscountsData();
  const userDiscounts = discountsData[userId] || { discounts: [] };
  
  let finalPrice = data.price;
  let appliedDiscount = 0;
  
  // Применяем скидку, если она есть
  if (userDiscounts.discounts && userDiscounts.discounts.length > 0) {
    const discount = userDiscounts.discounts[0];
    appliedDiscount = discount.percent;
    finalPrice = data.price * (1 - discount.percent / 100);
    
    // Удаляем примененную скидку
    userDiscounts.discounts.shift();
    
    // Добавляем в список примененных скидок
    if (!userDiscounts.appliedDiscounts) {
      userDiscounts.appliedDiscounts = [];
    }
    
    userDiscounts.appliedDiscounts.push({
      percent: discount.percent,
      appliedAt: new Date().toISOString(),
      orderId: orderId
    });
    
    // Сохраняем обновленные данные скидок
    discountsData[userId] = userDiscounts;
    saveDiscountsData(discountsData);
  }
  
  // Проверяем, является ли пользователь рефералом
  const referralsData = loadReferralsData();
  
  // Ищем реферера для текущего пользователя
  let referrerId = null;
  
  for (const [potentialReferrerId, referrerData] of Object.entries(referralsData)) {
    const isReferral = referrerData.referrals.some(ref => ref.userId === userId);
    
    if (isReferral) {
      referrerId = potentialReferrerId;
      break;
    }
  }
  
  // Если пользователь является рефералом, обновляем количество купленных звезд
  if (referrerId) {
    const updateResult = updateReferralStars(referrerId, userId, data.stars);
    
    if (updateResult.success && updateResult.newDiscounts > 0) {
      // Отправляем сообщение рефереру о новых скидках
      const discountMessage = updateResult.newDiscounts === 1
        ? `🎁 Ваш реферал купил ${data.stars} звезд! Вы получили скидку 5% на следующую покупку.`
        : `🎁 Ваш реферал купил ${data.stars} звезд! Вы получили ${updateResult.newDiscounts} скидки по 5% на следующие покупки.`;
      
      bot.sendMessage(referrerId, discountMessage);
    }
  }
  
  // Форматирование цены
  const formattedPrice = typeof finalPrice === 'number' 
    ? finalPrice.toFixed(2).replace(/\.00$/, '') 
    : finalPrice.toString().replace(/\.00$/, '');
  
  // Создаем красивое сообщение о заказе
  let orderMessage = `
✅ *Заказ успешно оформлен!*

📦 *Детали заказа:*
👤 Пользователь: \`${data.username}\`
⭐ Количество звезд: *${data.stars}*
`;

  // Добавляем информацию о скидке, если она была применена
  if (appliedDiscount > 0) {
    const originalPrice = typeof data.price === 'number' 
      ? data.price.toFixed(2).replace(/\.00$/, '') 
      : data.price.toString().replace(/\.00$/, '');
    
    orderMessage += `
💰 Стоимость: *${formattedPrice} ₽* (скидка ${appliedDiscount}% от ${originalPrice} ₽)
`;
  } else {
    orderMessage += `
💰 Стоимость: *${formattedPrice} ₽*
`;
  }

  orderMessage += `
🕒 Звезды будут добавлены на ваш аккаунт в течение 24 часов.

*Спасибо за покупку в TG Stars Store!* 🌟
`;

  // Отправляем сообщение о заказе
  bot.sendMessage(chatId, orderMessage, { parse_mode: 'Markdown' });
  
  // Отправляем стикер с благодарностью
  setTimeout(() => {
    bot.sendSticker(chatId, 'CAACAgIAAxkBAAELCmJlYWFiX1KAAh1Yd-KrCenN4HQj5QACbAADFkJrCmQVf98V_NMvMwQ');
  }, 1000);
  
  // Предлагаем пользователю поделиться реферальной ссылкой
  setTimeout(() => {
    const referralLink = `https://t.me/stars_store_bot?start=ref_${userId}`;
    
    bot.sendMessage(
      chatId,
      `🌟 *Приглашайте друзей и получайте скидки!*\n\nЗа каждые 100 звезд, купленных вашими рефералами, вы получаете скидку 5% на следующую покупку.\n\nВаша реферальная ссылка:\n\`${referralLink}\``,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Поделиться ссылкой', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Присоединяйся к Stars Store и получай звезды для своего Telegram аккаунта!')}` }]
          ]
        }
      }
    );
  }, 2000);
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
    const webAppUrl = `https://42150a8d-14a6-4d03-8420-8a80d6225b8b-00-2wgifpmi2x174.sisko.replit.dev/`;
    
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
