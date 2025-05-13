const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Импортируем бота
const bot = require('./bot');

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

// Функция для расчета скидок на основе купленных звезд
function calculateDiscounts(totalStars) {
  // За каждые 100 звезд начисляется скидка 5%
  return Math.floor(totalStars / 100);
}

// Функция для генерации реферальной ссылки
function generateReferralLink(userId) {
  return `https://t.me/stars_store_bot?start=ref_${userId}`;
}

// Создаем экземпляр Express
const app = express();
const PORT = process.env.PORT || 3000;

// Настраиваем статические файлы
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Маршрут для главной страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API эндпоинт для получения данных реферальной системы
app.get('/api/referral-data', (req, res) => {
  try {
    // Получаем идентификатор пользователя из заголовка Telegram WebApp
    const initData = req.headers['x-telegram-web-app-init-data'];
    
    console.log('Получен запрос на /api/referral-data с заголовками:', req.headers);
    
    let userId;
    
    if (initData) {
      try {
        // Парсим данные инициализации
        const initDataParams = new URLSearchParams(initData);
        const user = JSON.parse(initDataParams.get('user') || '{}');
        userId = user.id;
        
        console.log('Получены данные пользователя из initData:', user);
      } catch (parseError) {
        console.error('Ошибка при парсинге initData:', parseError);
      }
    }
    
    // Если не удалось получить userId из заголовка, пробуем получить из query параметров
    // Это запасной вариант для отладки и тестирования
    if (!userId && req.query.userId) {
      userId = req.query.userId;
      console.log('Используем userId из query параметров:', userId);
    }
    
    if (!userId) {
      console.error('Не удалось определить userId');
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    // Загружаем данные рефералов
    const referralsData = loadReferralsData();
    const userReferrals = referralsData[userId] || {
      userId: userId,
      referrals: [],
      totalReferralStars: 0
    };
    
    // Загружаем данные скидок
    const discountsData = loadDiscountsData();
    const userDiscounts = discountsData[userId] || {
      userId: userId,
      discounts: [],
      appliedDiscounts: []
    };
    
    // Генерируем реферальную ссылку
    const referralLink = generateReferralLink(userId);
    
    // Формируем ответ
    const responseData = {
      referralLink: referralLink,
      referrals: userReferrals.referrals,
      totalReferralStars: userReferrals.totalReferralStars,
      discounts: userDiscounts.discounts
    };
    
    return res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Ошибка при получении данных реферальной системы:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API эндпоинт для применения скидки
app.post('/api/apply-discount', express.json(), (req, res) => {
  try {
    // Получаем идентификатор пользователя из заголовка Telegram WebApp
    const initData = req.headers['x-telegram-web-app-init-data'];
    
    if (!initData) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Парсим данные инициализации
    const initDataParams = new URLSearchParams(initData);
    const user = JSON.parse(initDataParams.get('user') || '{}');
    const userId = user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found'
      });
    }
    
    // Получаем данные заказа из тела запроса
    const { orderId, price } = req.body;
    
    if (!orderId || !price) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and price are required'
      });
    }
    
    // Загружаем данные скидок
    const discountsData = loadDiscountsData();
    const userDiscounts = discountsData[userId] || {
      userId: userId,
      discounts: [],
      appliedDiscounts: []
    };
    
    // Проверяем, есть ли доступные скидки
    if (userDiscounts.discounts.length === 0) {
      return res.json({
        success: true,
        discount: 0,
        finalPrice: price
      });
    }
    
    // Применяем первую доступную скидку
    const discount = userDiscounts.discounts[0];
    const discountAmount = (discount.percent / 100) * price;
    const finalPrice = price - discountAmount;
    
    // Удаляем примененную скидку из списка доступных
    userDiscounts.discounts.shift();
    
    // Добавляем скидку в список примененных
    userDiscounts.appliedDiscounts.push({
      percent: discount.percent,
      appliedAt: new Date().toISOString(),
      orderId: orderId
    });
    
    // Сохраняем обновленные данные скидок
    discountsData[userId] = userDiscounts;
    saveDiscountsData(discountsData);
    
    return res.json({
      success: true,
      discount: discount.percent,
      finalPrice: finalPrice
    });
  } catch (error) {
    console.error('Ошибка при применении скидки:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// API эндпоинт для поиска пользователя по username
app.get('/api/search-user', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      });
    }
    
    // Удаляем символ @ в начале, если он есть
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    try {
      // Используем метод getChat для получения информации о пользователе
      const chatInfo = await bot.getChat('@' + cleanUsername);
      
      console.log('Получена информация о пользователе:', JSON.stringify(chatInfo, null, 2));
      
      // Проверяем наличие фото и получаем URL, если оно есть
      let photoUrl = null;
      if (chatInfo.photo && chatInfo.photo.small_file_id) {
        try {
          const file = await bot.getFile(chatInfo.photo.small_file_id);
          photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
          console.log('Получен URL фото:', photoUrl);
        } catch (photoError) {
          console.log('Ошибка при получении фото:', photoError);
          // Если не удалось получить фото, просто продолжаем без него
        }
      }
      
      // Формируем ответ с данными пользователя
      const userData = {
        id: chatInfo.id,
        username: chatInfo.username,
        first_name: chatInfo.first_name || (chatInfo.username ? chatInfo.username : 'Пользователь'),
        last_name: chatInfo.last_name,
        photo_url: photoUrl,
        is_private: false
      };
      
      return res.json({ 
        success: true, 
        user: userData 
      });
    } catch (error) {
      // Подробное логирование ошибки для диагностики
      console.log('Детали ошибки при поиске пользователя:');
      console.log('Код ошибки:', error.code);
      console.log('Полная ошибка:', JSON.stringify(error, null, 2));
      
      // Проверяем различные варианты ошибок
      // Считаем ошибку "chat not found" как признак приватного аккаунта
      const isPrivateAccount = 
        (error.code === 'ETELEGRAM' && error.response && error.response.body && (
          // Проверка на конкретные описания ошибок, связанные с приватностью
          (error.response.body.description && (
            error.response.body.description.includes('bot was blocked') ||
            error.response.body.description.includes('bot was kicked') ||
            error.response.body.description.includes('user is deactivated') ||
            error.response.body.description.includes('not enough rights') ||
            // Ошибка "chat not found" обычно означает, что пользователь существует,
            // но бот не может получить к нему доступ из-за настроек приватности
            error.response.body.description.includes('chat not found')
          )) ||
          // Проверка на коды ошибок, связанные с приватностью
          (error.response.body.error_code && [400, 403].includes(error.response.body.error_code))
        ));
      
      // Проверка на случай, когда пользователь действительно не существует
      // Эта проверка теперь используется только для явных случаев отсутствия пользователя
      const isUserNotFound = 
        (error.code === 'ETELEGRAM' && error.response && error.response.body && (
          (error.response.body.description && 
            error.response.body.description.includes('user not found')) ||
          (error.response.body.error_code && [404].includes(error.response.body.error_code))
        ));
      
      if (isPrivateAccount) {
        console.log('Пользователь определен как приватный');
        
        // Проверяем формат username для валидации
        const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
        if (!usernameRegex.test(cleanUsername)) {
          console.log('Неверный формат username:', cleanUsername);
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid username format',
            error_code: 'INVALID_USERNAME'
          });
        }
        
        // Пытаемся получить хотя бы базовую информацию о пользователе
        try {
          // Попытка получить информацию о пользователе без символа @
          // Иногда это может сработать для некоторых пользователей
          const chatInfo = await bot.getChat(cleanUsername);
          
          console.log('Получена частичная информация о приватном пользователе:', 
                     JSON.stringify(chatInfo, null, 2));
          
          return res.json({
            success: true,
            user: {
              id: chatInfo.id,
              username: chatInfo.username || cleanUsername,
              first_name: chatInfo.first_name || (chatInfo.username ? chatInfo.username : cleanUsername),
              last_name: chatInfo.last_name,
              is_private: true,
              photo_url: null
            }
          });
        } catch (secondError) {
          console.log('Не удалось получить дополнительную информацию о приватном пользователе');
          console.log('Детали ошибки при поиске пользователя:');
          console.log('Код ошибки:', error.code);
          console.log('Полная ошибка:', JSON.stringify(error, null, 2));
          
          // Возвращаем минимальную информацию о пользователе, предполагая что он существует
          // но является приватным
          return res.json({
            success: true,
            user: {
              username: cleanUsername,
              first_name: cleanUsername, // Используем username вместо "Пользователь"
              is_private: true,
              photo_url: null
            }
          });
        }
      }
      
      if (isUserNotFound) {
        console.log('Пользователь не найден');
        return res.status(404).json({ 
          success: false, 
          error: 'User not found',
          error_code: 'USER_NOT_FOUND'
        });
      }
      
      // Если произошла другая ошибка, возвращаем сообщение об ошибке
      console.error('Ошибка при поиске пользователя:', error);
      return res.status(404).json({ 
        success: false, 
        error: 'User not found',
        error_code: 'USER_NOT_FOUND'
      });
    }
  } catch (error) {
    console.error('Ошибка сервера:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      error_code: 'SERVER_ERROR'
    });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Мини-приложение доступно по адресу: https://42150a8d-14a6-4d03-8420-8a80d6225b8b-00-2wgifpmi2x174.sisko.replit.dev/`);
});

console.log('Бот запущен!');
