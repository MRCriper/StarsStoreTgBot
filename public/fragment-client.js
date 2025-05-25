/**
 * Fragment Client
 * 
 * Клиентская часть для работы с Fragment API и данными парсера
 */

class FragmentClient {
  constructor() {
    this.apiBaseUrl = '/api/fragment'; // Базовый URL для API на сервере
    this.gifts = []; // Кэш подарков
    this.lastUpdated = null; // Время последнего обновления
  }

  /**
   * Отправка запроса к API
   * @param {string} endpoint - Конечная точка API
   * @param {Object} data - Данные для отправки
   * @param {string} method - HTTP метод
   * @returns {Promise<Object>} Ответ от сервера
   */
  async sendRequest(endpoint, data = {}, method = 'POST') {
    try {
      // Получаем initData из Telegram WebApp
      const initData = window.Telegram.WebApp.initData;
      
      // Создаем заголовки для запроса
      const headers = {
        'Content-Type': 'application/json',
        'X-Telegram-Web-App-Init-Data': initData
      };
      
      // Формируем параметры запроса
      const requestOptions = {
        method: method,
        headers: headers,
        body: method !== 'GET' ? JSON.stringify(data) : undefined
      };
      
      // Формируем URL запроса
      let url = `${this.apiBaseUrl}/${endpoint}`;
      if (method === 'GET' && Object.keys(data).length > 0) {
        const queryParams = new URLSearchParams(data).toString();
        url = `${url}?${queryParams}`;
      }
      
      // Отправляем запрос
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      
      // Проверяем успешность запроса
      if (!response.ok) {
        throw new Error(responseData.error || 'Ошибка при выполнении запроса');
      }
      
      return responseData;
    } catch (error) {
      console.error(`Ошибка при выполнении запроса к ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Покупка звезд для пользователя
   * @param {string} username - Имя пользователя Telegram (без @)
   * @param {number} quantity - Количество звезд для покупки
   * @param {boolean} showSender - Показывать ли отправителя
   * @returns {Promise<Object>} Результат операции
   */
  async buyStars(username, quantity, showSender = false) {
    try {
      return await this.sendRequest('buy-stars', {
        username: username,
        quantity: quantity,
        show_sender: showSender
      });
    } catch (error) {
      console.error('Ошибка при покупке звезд:', error);
      throw error;
    }
  }

  /**
   * Проверка статуса транзакции
   * @param {string} transactionId - Идентификатор транзакции
   * @returns {Promise<Object>} Информация о транзакции
   */
  async checkTransactionStatus(transactionId) {
    try {
      return await this.sendRequest(`check-transaction/${transactionId}`, {}, 'GET');
    } catch (error) {
      console.error('Ошибка при проверке статуса транзакции:', error);
      throw error;
    }
  }

  /**
   * Получение истории транзакций
   * @param {number} limit - Ограничение количества транзакций
   * @returns {Promise<Array>} Список транзакций
   */
  async getTransactionsHistory(limit = 5) {
    try {
      const result = await this.sendRequest('transactions', { limit: limit }, 'GET');
      return result.transactions || [];
    } catch (error) {
      console.error('Ошибка при получении истории транзакций:', error);
      throw error;
    }
  }

  /**
   * Получение списка подарков Fragment
   * @returns {Promise<Array>} Список подарков
   */
  async getFragmentGifts() {
    try {
      // Если данные уже загружены и не устарели, возвращаем их из кэша
      const cacheTime = 5 * 60 * 1000; // 5 минут
      const now = new Date().getTime();
      
      if (this.gifts.length > 0 && this.lastUpdated && (now - this.lastUpdated) < cacheTime) {
        return this.gifts;
      }
      
      // Загружаем данные с сервера
      const result = await this.sendRequest('gifts', {}, 'GET');
      
      if (result.success) {
        this.gifts = result.gifts;
        this.lastUpdated = now;
      }
      
      return this.gifts;
    } catch (error) {
      console.error('Ошибка при получении списка подарков Fragment:', error);
      
      // В случае ошибки пытаемся загрузить данные из локального файла
      try {
        const response = await fetch('/fragment_gifts.json');
        const data = await response.json();
        return data.gifts || [];
      } catch (fallbackError) {
        console.error('Ошибка при загрузке локального файла подарков:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Получение данных подарка по ID
   * @param {string} id - ID подарка
   * @returns {Promise<Object|null>} Данные подарка
   */
  async getFragmentGiftById(id) {
    try {
      // Если данные уже загружены, ищем подарок в кэше
      if (this.gifts.length > 0) {
        const gift = this.gifts.find(g => g.id === id);
        if (gift) {
          return gift;
        }
      }
      
      // Загружаем данные с сервера
      const result = await this.sendRequest(`gifts/${id}`, {}, 'GET');
      
      if (result.success) {
        return result.gift;
      }
      
      return null;
    } catch (error) {
      console.error(`Ошибка при получении данных подарка ${id}:`, error);
      return null;
    }
  }

  /**
   * Запуск парсинга данных Fragment
   * @param {number} pages - Количество страниц для парсинга
   * @param {number} limit - Количество подарков на странице
   * @returns {Promise<Object>} Результат операции
   */
  async startFragmentParsing(pages = 5, limit = 20) {
    try {
      return await this.sendRequest('parse', {
        pages: pages,
        limit: limit
      });
    } catch (error) {
      console.error('Ошибка при запуске парсинга Fragment:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем экземпляр клиента
const fragmentClient = new FragmentClient();