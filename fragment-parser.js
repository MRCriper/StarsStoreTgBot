/**
 * Fragment Parser
 * 
 * Модуль для парсинга данных с сайта Fragment
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
require('dotenv').config();

// Путь к файлу с данными подарков
const GIFTS_DATA_PATH = path.join(__dirname, 'fragment-gifts-data.json');

// Класс для парсинга данных с сайта Fragment
class FragmentParser {
  constructor() {
    this.giftsData = this.loadGiftsData();
    this.isRunning = false;
    this.browser = null;
    this.page = null;
  }

  /**
   * Загрузка данных подарков
   * @returns {Object} Данные подарков
   */
  loadGiftsData() {
    try {
      if (fs.existsSync(GIFTS_DATA_PATH)) {
        const data = fs.readFileSync(GIFTS_DATA_PATH, 'utf8');
        return JSON.parse(data);
      }
      return {
        gifts: [],
        lastUpdated: null
      };
    } catch (error) {
      console.error('Ошибка при загрузке данных подарков:', error);
      return {
        gifts: [],
        lastUpdated: null
      };
    }
  }

  /**
   * Сохранение данных подарков
   */
  saveGiftsData() {
    try {
      this.giftsData.lastUpdated = new Date().toISOString();
      fs.writeFileSync(GIFTS_DATA_PATH, JSON.stringify(this.giftsData, null, 2), 'utf8');
      
      // Также сохраняем копию данных в публичной директории для доступа из клиента
      const publicPath = path.join(__dirname, 'public', 'fragment_gifts.json');
      fs.writeFileSync(publicPath, JSON.stringify({ gifts: this.giftsData.gifts }, null, 2), 'utf8');
      
      console.log(`Данные подарков сохранены. Всего подарков: ${this.giftsData.gifts.length}`);
    } catch (error) {
      console.error('Ошибка при сохранении данных подарков:', error);
    }
  }

  /**
   * Инициализация браузера
   */
  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Устанавливаем размер окна
      await this.page.setViewport({ width: 1280, height: 800 });
      
      // Устанавливаем таймаут навигации
      await this.page.setDefaultNavigationTimeout(60000);
      
      console.log('Браузер инициализирован');
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации браузера:', error);
      return false;
    }
  }

  /**
   * Закрытие браузера
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('Браузер закрыт');
    }
  }

  /**
   * Парсинг данных подарка
   * @param {string} giftUrl - URL подарка
   * @returns {Object|null} Данные подарка
   */
  async parseGiftData(giftUrl) {
    try {
      console.log(`Парсинг данных подарка: ${giftUrl}`);
      
      // Переходим на страницу подарка
      await this.page.goto(giftUrl, { waitUntil: 'networkidle2' });
      
      // Ждем загрузки данных подарка
      await this.page.waitForSelector('.gift-details', { timeout: 10000 }).catch(() => {});
      
      // Извлекаем данные подарка
      const giftData = await this.page.evaluate(() => {
        try {
          // Название и номер
          const titleElement = document.querySelector('h1.gift-title');
          const titleText = titleElement ? titleElement.textContent.trim() : '';
          const [name, number] = titleText.split('#').map(part => part.trim());
          
          // Владелец
          const ownerElement = document.querySelector('.gift-owner a');
          const owner = ownerElement ? ownerElement.textContent.trim() : '';
          
          // Модель
          const modelElement = document.querySelector('.gift-model');
          const modelText = modelElement ? modelElement.textContent.trim() : '';
          const [modelName, modelRarity] = modelText.split(' ').map(part => part.trim());
          
          // Фон
          const backgroundElement = document.querySelector('.gift-background');
          const backgroundText = backgroundElement ? backgroundElement.textContent.trim() : '';
          const [backgroundName, backgroundRarity] = backgroundText.split(' ').map(part => part.trim());
          
          // Символ
          const symbolElement = document.querySelector('.gift-symbol');
          const symbolText = symbolElement ? symbolElement.textContent.trim() : '';
          const [symbolName, symbolRarity] = symbolText.split(' ').map(part => part.trim());
          
          // Саплай
          const supplyElement = document.querySelector('.gift-supply');
          const supplyText = supplyElement ? supplyElement.textContent.trim() : '';
          
          // Изображение
          const imageElement = document.querySelector('.gift-image img');
          const imageUrl = imageElement ? imageElement.src : '';
          
          return {
            id: number,
            name: name,
            owner: owner,
            model: {
              name: modelName,
              rarity: modelRarity
            },
            background: {
              name: backgroundName,
              rarity: backgroundRarity
            },
            symbol: {
              name: symbolName,
              rarity: symbolRarity
            },
            supply: supplyText,
            image: imageUrl,
            url: window.location.href
          };
        } catch (error) {
          console.error('Ошибка при извлечении данных подарка:', error);
          return null;
        }
      });
      
      return giftData;
    } catch (error) {
      console.error(`Ошибка при парсинге данных подарка ${giftUrl}:`, error);
      return null;
    }
  }

  /**
   * Получение списка URL подарков
   * @param {number} page - Номер страницы
   * @param {number} limit - Количество подарков на странице
   * @returns {Array<string>} Список URL подарков
   */
  async getGiftUrls(page = 1, limit = 20) {
    try {
      console.log(`Получение списка URL подарков (страница ${page}, лимит ${limit})`);
      
      // Переходим на страницу со списком подарков
      const url = `https://fragment.com/gifts?page=${page}&limit=${limit}`;
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      // Ждем загрузки списка подарков
      await this.page.waitForSelector('.gift-list', { timeout: 10000 }).catch(() => {});
      
      // Извлекаем URL подарков
      const giftUrls = await this.page.evaluate(() => {
        const giftElements = document.querySelectorAll('.gift-item a');
        return Array.from(giftElements).map(element => element.href);
      });
      
      return giftUrls;
    } catch (error) {
      console.error(`Ошибка при получении списка URL подарков (страница ${page}):`, error);
      return [];
    }
  }

  /**
   * Парсинг данных подарков
   * @param {number} pages - Количество страниц для парсинга
   * @param {number} limit - Количество подарков на странице
   * @returns {boolean} Результат операции
   */
  async parseGifts(pages = 5, limit = 20) {
    if (this.isRunning) {
      console.log('Парсинг уже запущен');
      return false;
    }
    
    this.isRunning = true;
    console.log(`Начало парсинга данных подарков (страниц: ${pages}, лимит: ${limit})`);
    
    try {
      // Инициализируем браузер
      const browserInitialized = await this.initBrowser();
      if (!browserInitialized) {
        this.isRunning = false;
        return false;
      }
      
      // Временный массив для новых данных
      const newGifts = [];
      
      // Парсим данные подарков с каждой страницы
      for (let page = 1; page <= pages; page++) {
        // Получаем список URL подарков
        const giftUrls = await this.getGiftUrls(page, limit);
        console.log(`Получено ${giftUrls.length} URL подарков на странице ${page}`);
        
        // Парсим данные каждого подарка
        for (const giftUrl of giftUrls) {
          const giftData = await this.parseGiftData(giftUrl);
          
          if (giftData) {
            newGifts.push(giftData);
            console.log(`Успешно спарсены данные подарка: ${giftData.name} #${giftData.id}`);
          }
        }
        
        // Делаем паузу между страницами, чтобы не нагружать сервер
        if (page < pages) {
          console.log(`Пауза перед парсингом следующей страницы...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Обновляем данные подарков
      this.giftsData.gifts = newGifts;
      this.saveGiftsData();
      
      // Закрываем браузер
      await this.closeBrowser();
      
      console.log(`Парсинг данных подарков завершен. Всего подарков: ${newGifts.length}`);
      this.isRunning = false;
      return true;
    } catch (error) {
      console.error('Ошибка при парсинге данных подарков:', error);
      
      // Закрываем браузер в случае ошибки
      await this.closeBrowser();
      
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Запуск планировщика для регулярного парсинга данных
   * @param {string} cronExpression - Выражение cron для планировщика
   * @param {number} pages - Количество страниц для парсинга
   * @param {number} limit - Количество подарков на странице
   */
  startScheduler(cronExpression = '0 */6 * * *', pages = 5, limit = 20) {
    console.log(`Запуск планировщика с выражением: ${cronExpression}`);
    
    // Создаем задачу cron
    const job = new CronJob(
      cronExpression,
      async () => {
        console.log(`Запуск запланированного парсинга данных: ${new Date().toISOString()}`);
        await this.parseGifts(pages, limit);
      },
      null,
      true,
      'UTC'
    );
    
    // Запускаем задачу
    job.start();
    console.log('Планировщик запущен');
    
    // Также запускаем парсинг сразу при старте
    this.parseGifts(pages, limit);
  }

  /**
   * Получение данных подарков
   * @returns {Array} Список подарков
   */
  getGifts() {
    return this.giftsData.gifts;
  }

  /**
   * Получение данных подарка по ID
   * @param {string} id - ID подарка
   * @returns {Object|null} Данные подарка
   */
  getGiftById(id) {
    return this.giftsData.gifts.find(gift => gift.id === id) || null;
  }

  /**
   * Получение времени последнего обновления данных
   * @returns {string|null} Время последнего обновления
   */
  getLastUpdated() {
    return this.giftsData.lastUpdated;
  }
}

// Создаем и экспортируем экземпляр парсера
const fragmentParser = new FragmentParser();
module.exports = fragmentParser;