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
      
      // Формируем ответ с данными пользователя
      const userData = {
        id: chatInfo.id,
        username: chatInfo.username,
        first_name: chatInfo.first_name,
        last_name: chatInfo.last_name,
        photo_url: chatInfo.photo ? chatInfo.photo.small_file_id : null,
        is_private: false
      };
      
      return res.json({ 
        success: true, 
        user: userData 
      });
    } catch (error) {
      // Проверяем, является ли ошибка связанной с приватностью аккаунта
      if (error.response && error.response.body && 
          (error.response.body.description.includes('chat not found') || 
           error.response.body.description.includes('bot was blocked'))) {
        
        // Пытаемся вернуть минимальную информацию о пользователе
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
