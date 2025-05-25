/**
 * Fragment API Client
 * 
 * Клиентская часть для работы с Fragment API через сервер
 */

class FragmentClient {
  constructor() {
    this.apiBaseUrl = '/api/fragment'; // Базовый URL для API на сервере
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
}

// Создаем и экспортируем экземпляр клиента
const fragmentClient = new FragmentClient();