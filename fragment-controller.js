/**
 * Fragment Controller
 * 
 * Контроллер для обработки операций с Fragment API
 */

const FragmentAPI = require('./fragment-api');
const fs = require('fs');
const path = require('path');

// Путь к файлу с данными транзакций
const TRANSACTIONS_DATA_PATH = path.join(__dirname, 'transactions-data.json');

// Класс контроллера для работы с Fragment API
class FragmentController {
  constructor() {
    this.fragmentAPI = new FragmentAPI();
    this.transactionsData = this.loadTransactionsData();
  }

  /**
   * Загрузка данных транзакций
   * @returns {Object} Данные транзакций
   */
  loadTransactionsData() {
    try {
      if (fs.existsSync(TRANSACTIONS_DATA_PATH)) {
        const data = fs.readFileSync(TRANSACTIONS_DATA_PATH, 'utf8');
        return JSON.parse(data);
      }
      return {
        transactions: []
      };
    } catch (error) {
      console.error('Ошибка при загрузке данных транзакций:', error);
      return {
        transactions: []
      };
    }
  }

  /**
   * Сохранение данных транзакций
   */
  saveTransactionsData() {
    try {
      fs.writeFileSync(TRANSACTIONS_DATA_PATH, JSON.stringify(this.transactionsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Ошибка при сохранении данных транзакций:', error);
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
      // Удаляем символ @ в начале, если он есть
      if (username.startsWith('@')) {
        username = username.substring(1);
      }

      // Покупаем звезды через Fragment API
      const result = await this.fragmentAPI.buyStars(username, quantity, showSender);

      // Если операция успешна, сохраняем данные транзакции
      if (result.success) {
        const transaction = {
          id: result.orderId,
          username: username,
          quantity: quantity,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };

        this.transactionsData.transactions.push(transaction);
        this.saveTransactionsData();
      }

      return result;
    } catch (error) {
      console.error('Ошибка при покупке звезд:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Получение истории транзакций
   * @param {number} limit - Ограничение количества транзакций
   * @returns {Array} Список транзакций
   */
  getTransactionsHistory(limit = 10) {
    try {
      // Получаем последние транзакции
      const transactions = [...this.transactionsData.transactions]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      return transactions;
    } catch (error) {
      console.error('Ошибка при получении истории транзакций:', error);
      return [];
    }
  }

  /**
   * Проверка статуса транзакции
   * @param {string} transactionId - Идентификатор транзакции
   * @returns {Promise<Object>} Информация о транзакции
   */
  async checkTransactionStatus(transactionId) {
    try {
      // Проверяем статус заказа через Fragment API
      const result = await this.fragmentAPI.checkOrderStatus(transactionId);

      // Если операция успешна, обновляем данные транзакции
      if (result.success) {
        const transactionIndex = this.transactionsData.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
          this.transactionsData.transactions[transactionIndex].status = 'completed';
          this.saveTransactionsData();
        }
      }

      return result;
    } catch (error) {
      console.error('Ошибка при проверке статуса транзакции:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FragmentController;