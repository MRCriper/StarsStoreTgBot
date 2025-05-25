/**
 * Fragment API Integration Module
 * 
 * Этот модуль обеспечивает интеграцию с Fragment API для автоматизации покупки
 * и отправки звёзд пользователям Telegram.
 */

const axios = require('axios');
require('dotenv').config();

// Базовый URL для Fragment API
const API_BASE_URL = 'https://api.fragment-api.com/v1';

// Класс для работы с Fragment API
class FragmentAPI {
  constructor() {
    this.token = null;
    this.apiKey = process.env.FRAGMENT_API_KEY;
    this.phoneNumber = process.env.FRAGMENT_PHONE_NUMBER;
    this.mnemonics = process.env.FRAGMENT_MNEMONICS;
  }

  /**
   * Аутентификация в Fragment API
   * @returns {Promise<boolean>} Результат аутентификации
   */
  async authenticate() {
    try {
      // Проверяем наличие необходимых данных для аутентификации
      if (!this.apiKey || !this.phoneNumber || !this.mnemonics) {
        throw new Error('Отсутствуют необходимые данные для аутентификации (API ключ, номер телефона или мнемоническая фраза)');
      }

      // Отправляем запрос на аутентификацию
      const response = await axios.post(`${API_BASE_URL}/authenticate`, {
        api_key: this.apiKey,
        phone_number: this.phoneNumber,
        mnemonics: this.mnemonics
      });

      // Проверяем успешность аутентификации
      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('Аутентификация в Fragment API успешно выполнена');
        return true;
      } else {
        throw new Error('Не удалось получить токен аутентификации');
      }
    } catch (error) {
      console.error('Ошибка аутентификации в Fragment API:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
      return false;
    }
  }

  /**
   * Проверка и обновление токена аутентификации при необходимости
   * @returns {Promise<boolean>} Результат проверки/обновления токена
   */
  async ensureAuthenticated() {
    if (!this.token) {
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Покупка звезд для пользователя
   * @param {string} username - Имя пользователя Telegram (без @)
   * @param {number} quantity - Количество звезд для покупки (минимум 50)
   * @param {boolean} showSender - Показывать ли отправителя (по умолчанию false)
   * @returns {Promise<Object>} Результат операции
   */
  async buyStars(username, quantity, showSender = false) {
    try {
      // Проверяем и обновляем токен аутентификации при необходимости
      const isAuthenticated = await this.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Не удалось аутентифицироваться в Fragment API');
      }

      // Проверяем валидность параметров
      if (!username) {
        throw new Error('Не указано имя пользователя');
      }

      // Удаляем символ @ в начале, если он есть
      if (username.startsWith('@')) {
        username = username.substring(1);
      }

      // Проверяем формат имени пользователя
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
      if (!usernameRegex.test(username)) {
        throw new Error('Неверный формат имени пользователя');
      }

      // Проверяем количество звезд
      if (!quantity || quantity < 50 || quantity > 1000000) {
        throw new Error('Количество звезд должно быть от 50 до 1000000');
      }

      // Отправляем запрос на покупку звезд
      const response = await axios.post(
        `${API_BASE_URL}/stars/buy`,
        {
          username: username,
          quantity: quantity,
          show_sender: showSender
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Проверяем успешность операции
      if (response.data && response.data.success) {
        console.log(`Успешно куплено ${quantity} звезд для пользователя @${username}`);
        return {
          success: true,
          orderId: response.data.id,
          receiver: response.data.receiver,
          quantity: response.data.goods_quantity
        };
      } else {
        throw new Error('Не удалось купить звезды');
      }
    } catch (error) {
      console.error('Ошибка при покупке звезд:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
      return {
        success: false,
        error: error.message,
        details: error.response ? error.response.data : null
      };
    }
  }

  /**
   * Проверка статуса заказа
   * @param {string} orderId - Идентификатор заказа
   * @returns {Promise<Object>} Информация о заказе
   */
  async checkOrderStatus(orderId) {
    try {
      // Проверяем и обновляем токен аутентификации при необходимости
      const isAuthenticated = await this.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Не удалось аутентифицироваться в Fragment API');
      }

      // Проверяем валидность параметров
      if (!orderId) {
        throw new Error('Не указан идентификатор заказа');
      }

      // Отправляем запрос на проверку статуса заказа
      const response = await axios.get(
        `${API_BASE_URL}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Возвращаем информацию о заказе
      return response.data;
    } catch (error) {
      console.error('Ошибка при проверке статуса заказа:', error.message);
      if (error.response) {
        console.error('Ответ сервера:', error.response.data);
      }
      return {
        success: false,
        error: error.message,
        details: error.response ? error.response.data : null
      };
    }
  }
}

module.exports = FragmentAPI;