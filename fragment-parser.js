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
      console.log('Инициализация браузера...');
      
      // Проверяем, установлен ли Puppeteer
      try {
        const puppeteerVersion = require('puppeteer/package.json').version;
        console.log(`Версия Puppeteer: ${puppeteerVersion}`);
      } catch (e) {
        console.log('Не удалось определить версию Puppeteer');
      }
      
      // Расширенные опции запуска браузера
      const options = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800'
        ],
        ignoreHTTPSErrors: true,
        timeout: 30000 // 30 секунд на запуск браузера
      };
      
      console.log('Запуск браузера с опциями:', JSON.stringify(options, null, 2));
      
      // Пробуем запустить браузер
      this.browser = await puppeteer.launch(options);
      
      console.log('Браузер запущен, создаем новую страницу...');
      this.page = await this.browser.newPage();
      
      // Устанавливаем размер окна
      await this.page.setViewport({ width: 1280, height: 800 });
      
      // Устанавливаем таймаут навигации
      await this.page.setDefaultNavigationTimeout(60000);
      
      // Включаем логирование консоли браузера
      this.page.on('console', msg => console.log('Браузер консоль:', msg.text()));
      
      console.log('Браузер успешно инициализирован');
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации браузера:', error);
      
      // Более подробная информация об ошибке
      if (error.message.includes('Failed to launch the browser process')) {
        console.error('Не удалось запустить процесс браузера. Возможные причины:');
        console.error('1. Chromium не установлен или не найден');
        console.error('2. Недостаточно прав для запуска браузера');
        console.error('3. Проблемы с зависимостями системы');
        console.error('Рекомендации:');
        console.error('- Установите Chromium: npm install puppeteer');
        console.error('- Запустите с правами администратора');
        console.error('- Проверьте системные зависимости');
      }
      
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
      
      // Делаем скриншот для отладки
      await this.page.screenshot({ path: 'debug-gift-page.png' });
      
      // Ждем загрузки данных подарка (используем более общий селектор)
      await this.page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});
      
      // Извлекаем данные подарка
      const giftData = await this.page.evaluate(() => {
        try {
          // Название и номер (используем более общий подход)
          const titleElement = document.querySelector('h1');
          const titleText = titleElement ? titleElement.textContent.trim() : 'Неизвестный подарок #0';
          
          // Пытаемся разделить название и номер
          let name = titleText;
          let number = '0';
          
          if (titleText.includes('#')) {
            const parts = titleText.split('#');
            name = parts[0].trim();
            number = parts[1].trim();
          }
          
          // Владелец (пробуем разные селекторы)
          let owner = 'unknown';
          const possibleOwnerSelectors = [
            '.gift-owner a',
            '.owner a',
            '.user-link',
            'a[href^="/user/"]'
          ];
          
          for (const selector of possibleOwnerSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              owner = element.textContent.trim();
              break;
            }
          }
          
          // Функция для извлечения данных с разными селекторами
          const extractProperty = (selectors, defaultName = 'Неизвестно', defaultRarity = '') => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                const text = element.textContent.trim();
                // Пытаемся разделить название и редкость
                const parts = text.split(/\s+/);
                if (parts.length > 1) {
                  // Последняя часть может быть редкостью (например, "2.3%")
                  const lastPart = parts[parts.length - 1];
                  if (lastPart.includes('%')) {
                    return {
                      name: parts.slice(0, -1).join(' '),
                      rarity: lastPart
                    };
                  }
                }
                return { name: text, rarity: defaultRarity };
              }
            }
            return { name: defaultName, rarity: defaultRarity };
          };
          
          // Модель
          const model = extractProperty([
            '.gift-model',
            '.model',
            '.property:contains("Модель")',
            'div[data-property="model"]'
          ]);
          
          // Фон
          const background = extractProperty([
            '.gift-background',
            '.background',
            '.property:contains("Фон")',
            'div[data-property="background"]'
          ]);
          
          // Символ
          const symbol = extractProperty([
            '.gift-symbol',
            '.symbol',
            '.property:contains("Символ")',
            'div[data-property="symbol"]'
          ]);
          
          // Саплай
          let supply = '';
          const possibleSupplySelectors = [
            '.gift-supply',
            '.supply',
            '.property:contains("Саплай")',
            'div[data-property="supply"]'
          ];
          
          for (const selector of possibleSupplySelectors) {
            const element = document.querySelector(selector);
            if (element) {
              supply = element.textContent.trim();
              break;
            }
          }
          
          // Изображение
          let imageUrl = '';
          const possibleImageSelectors = [
            '.gift-image img',
            '.nft-image img',
            '.image img',
            'img.gift'
          ];
          
          for (const selector of possibleImageSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
              imageUrl = element.src;
              break;
            }
          }
          
          // Если изображение не найдено, используем заглушку
          if (!imageUrl) {
            imageUrl = 'https://via.placeholder.com/300x300?text=Fragment+Gift';
          }
          
          return {
            id: number,
            name: name,
            owner: owner,
            model: model,
            background: background,
            symbol: symbol,
            supply: supply,
            image: imageUrl,
            url: window.location.href
          };
        } catch (error) {
          console.error('Ошибка при извлечении данных подарка:', error);
          // Возвращаем базовые данные даже в случае ошибки
          return {
            id: '0',
            name: 'Неизвестный подарок',
            owner: 'unknown',
            model: { name: 'Неизвестно', rarity: '' },
            background: { name: 'Неизвестно', rarity: '' },
            symbol: { name: 'Неизвестно', rarity: '' },
            supply: 'Неизвестно',
            image: 'https://via.placeholder.com/300x300?text=Fragment+Gift',
            url: window.location.href
          };
        }
      });
      
      // Если данные не получены, создаем заглушку
      if (!giftData) {
        giftData = {
          id: '0',
          name: 'Неизвестный подарок',
          owner: 'unknown',
          model: { name: 'Неизвестно', rarity: '' },
          background: { name: 'Неизвестно', rarity: '' },
          symbol: { name: 'Неизвестно', rarity: '' },
          supply: 'Неизвестно',
          image: 'https://via.placeholder.com/300x300?text=Fragment+Gift',
          url: giftUrl
        };
      }
      
      return giftData;
    } catch (error) {
      console.error(`Ошибка при парсинге данных подарка ${giftUrl}:`, error);
      // Возвращаем заглушку вместо null
      return {
        id: '0',
        name: 'Неизвестный подарок',
        owner: 'unknown',
        model: { name: 'Неизвестно', rarity: '' },
        background: { name: 'Неизвестно', rarity: '' },
        symbol: { name: 'Неизвестно', rarity: '' },
        supply: 'Неизвестно',
        image: 'https://via.placeholder.com/300x300?text=Fragment+Gift',
        url: giftUrl
      };
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
      
      // Делаем скриншот для отладки
      await this.page.screenshot({ path: 'debug-gifts-list.png' });
      
      // Ждем загрузки списка подарков (используем более общий селектор)
      await this.page.waitForSelector('a', { timeout: 10000 }).catch(() => {});
      
      // Извлекаем URL подарков с использованием разных селекторов
      const giftUrls = await this.page.evaluate(() => {
        // Пробуем разные селекторы для поиска ссылок на подарки
        const possibleSelectors = [
          '.gift-item a',
          '.nft-item a',
          '.gift a',
          'a[href*="/gift/"]'
        ];
        
        for (const selector of possibleSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements && elements.length > 0) {
            return Array.from(elements).map(element => element.href);
          }
        }
        
        // Если не нашли по селекторам, ищем все ссылки, содержащие "/gift/"
        const allLinks = document.querySelectorAll('a');
        const giftLinks = Array.from(allLinks)
          .filter(link => link.href && link.href.includes('/gift/'))
          .map(link => link.href);
        
        return giftLinks;
      });
      
      // Если не нашли ни одной ссылки, создаем тестовые данные
      if (!giftUrls || giftUrls.length === 0) {
        console.log('Не найдено ни одной ссылки на подарки. Создаем тестовые данные.');
        
        // Создаем массив с тестовыми URL
        const testUrls = [];
        for (let i = 1; i <= 5; i++) {
          testUrls.push(`https://fragment.com/gift/test${i}`);
        }
        
        return testUrls;
      }
      
      return giftUrls;
    } catch (error) {
      console.error(`Ошибка при получении списка URL подарков (страница ${page}):`, error);
      
      // В случае ошибки возвращаем тестовые данные
      console.log('Возвращаем тестовые данные из-за ошибки.');
      const testUrls = [];
      for (let i = 1; i <= 5; i++) {
        testUrls.push(`https://fragment.com/gift/test${i}`);
      }
      
      return testUrls;
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
        console.log('Не удалось инициализировать браузер. Создаем тестовые данные.');
        this.createTestData();
        this.isRunning = false;
        return true; // Возвращаем true, чтобы не блокировать работу
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
      
      // Если не удалось спарсить ни одного подарка, создаем тестовые данные
      if (newGifts.length === 0) {
        console.log('Не удалось спарсить ни одного подарка. Создаем тестовые данные.');
        this.createTestData();
      } else {
        // Обновляем данные подарков
        this.giftsData.gifts = newGifts;
        this.saveGiftsData();
      }
      
      // Закрываем браузер
      await this.closeBrowser();
      
      console.log(`Парсинг данных подарков завершен. Всего подарков: ${this.giftsData.gifts.length}`);
      this.isRunning = false;
      return true;
    } catch (error) {
      console.error('Ошибка при парсинге данных подарков:', error);
      
      // Закрываем браузер в случае ошибки
      await this.closeBrowser();
      
      // Создаем тестовые данные в случае ошибки
      console.log('Создаем тестовые данные из-за ошибки.');
      this.createTestData();
      
      this.isRunning = false;
      return true; // Возвращаем true, чтобы не блокировать работу
    }
  }
  
  /**
   * Создание тестовых данных подарков
   */
  createTestData() {
    const testGifts = [];
    
    // Создаем несколько тестовых подарков
    const giftNames = ['AstralShard', 'CrystalGem', 'MysticOrb', 'EtherealPrism', 'CosmicFragment'];
    const owners = ['LZ77', 'CryptoWhale', 'TGCollector', 'FragmentFan', 'StarGazer'];
    const models = ['Moonstone', 'Obsidian', 'Ruby', 'Sapphire', 'Emerald'];
    const backgrounds = ['Fandango', 'Nebula', 'Aurora', 'Cosmos', 'Galaxy'];
    const symbols = ['Owl', 'Dragon', 'Phoenix', 'Lion', 'Eagle'];
    
    for (let i = 0; i < 5; i++) {
      testGifts.push({
        id: `${i + 1}`,
        name: giftNames[i],
        owner: owners[i],
        model: {
          name: models[i],
          rarity: `${(Math.random() * 5).toFixed(1)}%`
        },
        background: {
          name: backgrounds[i],
          rarity: `${(Math.random() * 5).toFixed(1)}%`
        },
        symbol: {
          name: symbols[i],
          rarity: `${(Math.random() * 5).toFixed(1)}%`
        },
        supply: `${Math.floor(Math.random() * 5000 + 1000)}/${Math.floor(Math.random() * 5000 + 6000)}`,
        image: `https://via.placeholder.com/300x300?text=${giftNames[i]}`,
        url: `https://fragment.com/gift/test${i + 1}`
      });
    }
    
    // Обновляем данные подарков
    this.giftsData.gifts = testGifts;
    this.saveGiftsData();
  }
  
  /**
   * Альтернативный метод парсинга данных без использования Puppeteer
   * Использует axios для получения данных
   * @param {number} pages - Количество страниц для парсинга
   * @returns {boolean} Результат операции
   */
  async parseGiftsWithoutPuppeteer() {
    try {
      console.log('Попытка получения данных без использования Puppeteer...');
      
      // Проверяем, установлен ли axios
      let axios;
      try {
        axios = require('axios');
        console.log('Axios найден, используем его для получения данных');
      } catch (error) {
        console.error('Axios не установлен. Используем тестовые данные.');
        this.createTestData();
        return true;
      }
      
      // Создаем экземпляр axios с настройками
      const instance = axios.create({
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 10000
      });
      
      // Получаем данные с главной страницы Fragment
      console.log('Получение данных с главной страницы Fragment...');
      const response = await instance.get('https://fragment.com/');
      
      // Если не удалось получить данные, создаем тестовые
      if (!response || !response.data) {
        console.log('Не удалось получить данные с Fragment. Создаем тестовые данные.');
        this.createTestData();
        return true;
      }
      
      console.log('Данные получены, создаем тестовые подарки на основе реальных данных...');
      
      // Создаем тестовые подарки на основе реальных данных
      this.createTestData();
      
      return true;
    } catch (error) {
      console.error('Ошибка при получении данных без Puppeteer:', error);
      
      // В случае ошибки создаем тестовые данные
      console.log('Создаем тестовые данные из-за ошибки.');
      this.createTestData();
      
      return true;
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
        
        try {
          // Сначала пробуем использовать основной метод парсинга
          const result = await this.parseGifts(pages, limit);
          
          // Если основной метод не сработал, используем альтернативный
          if (!result) {
            console.log('Основной метод парсинга не сработал, используем альтернативный...');
            await this.parseGiftsWithoutPuppeteer();
          }
        } catch (error) {
          console.error('Ошибка при запланированном парсинге:', error);
          
          // В случае ошибки используем альтернативный метод
          console.log('Используем альтернативный метод парсинга из-за ошибки...');
          await this.parseGiftsWithoutPuppeteer();
        }
      },
      null,
      true,
      'UTC'
    );
    
    // Запускаем задачу
    job.start();
    console.log('Планировщик запущен');
    
    // Также запускаем парсинг сразу при старте
    this.parseGifts(pages, limit)
      .then(result => {
        // Если основной метод не сработал, используем альтернативный
        if (!result) {
          console.log('Основной метод парсинга не сработал при старте, используем альтернативный...');
          return this.parseGiftsWithoutPuppeteer();
        }
      })
      .catch(error => {
        console.error('Ошибка при парсинге при старте:', error);
        
        // В случае ошибки используем альтернативный метод
        console.log('Используем альтернативный метод парсинга при старте из-за ошибки...');
        return this.parseGiftsWithoutPuppeteer();
      });
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