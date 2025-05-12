const express = require('express');
const path = require('path');
require('dotenv').config();

// Импортируем бота
const bot = require('./bot');

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
        first_name: chatInfo.first_name || 'Пользователь',
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
      
      // Проверяем различные варианты ошибок, связанных с приватностью аккаунта
      const isPrivateAccount = 
        // Проверка на ошибки Telegram API, связанные с приватностью
        (error.code === 'ETELEGRAM' && error.response && error.response.body && (
          // Проверка на конкретные описания ошибок, связанные с приватностью
          (error.response.body.description && (
            error.response.body.description.includes('bot was blocked') ||
            error.response.body.description.includes('bot was kicked') ||
            error.response.body.description.includes('user is deactivated') ||
            error.response.body.description.includes('not enough rights') ||
            // Добавляем проверку на приватность чата
            error.response.body.description.includes('chat not found')
          )) ||
          // Проверка на коды ошибок, связанные с приватностью
          (error.response.body.error_code && [403].includes(error.response.body.error_code))
        ));
      
      // Проверка на случай, когда пользователь не найден
      const isUserNotFound = 
        (error.code === 'ETELEGRAM' && error.response && error.response.body && (
          (error.response.body.description && 
            // Изменяем условие, чтобы не пересекалось с приватными аккаунтами
            (error.response.body.description.includes('chat not found') && 
             !error.response.body.description.includes('bot was blocked') &&
             !error.response.body.description.includes('bot was kicked') &&
             !error.response.body.description.includes('user is deactivated') &&
             !error.response.body.description.includes('not enough rights'))) ||
          (error.response.body.error_code && [400, 404].includes(error.response.body.error_code) && 
           error.response.body.error_code !== 403)
        ));
      
      if (isPrivateAccount) {
        console.log('Пользователь определен как приватный');
        
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
              first_name: chatInfo.first_name || 'Пользователь',
              last_name: chatInfo.last_name,
              is_private: true,
              photo_url: null
            }
          });
        } catch (secondError) {
          console.log('Не удалось получить дополнительную информацию о приватном пользователе');
          
          // Возвращаем минимальную информацию о пользователе
          return res.json({
            success: true,
            user: {
              username: cleanUsername,
              first_name: 'Пользователь',
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
