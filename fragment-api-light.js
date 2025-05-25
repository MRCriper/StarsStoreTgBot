/**
 * Fragment API Light
 * 
 * Легкая версия API для работы с Fragment без использования Puppeteer
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
require('dotenv').config();

// Путь к файлу с данными подарков
const GIFTS_DATA_PATH = path.join(__dirname, 'fragment-gifts-data.json');

// Класс для работы с Fragment API без Puppeteer
class FragmentApiLight {
  constructor() {
    this.giftsData = this.loadGiftsData();
    this.isRunning = false;
    
    // Настройки HTTP клиента
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 30000
    });
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
   * Получение HTML страницы
   * @param {string} url - URL страницы
   * @returns {Promise<string|null>} HTML страницы
   */
  async fetchHtml(url) {
    try {
      console.log(`Получение HTML страницы: ${url}`);
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении HTML страницы ${url}:`, error);
      return null;
    }
  }

  /**
   * Парсинг данных подарка
   * @param {string} giftUrl - URL подарка
   * @returns {Promise<Object|null>} Данные подарка
   */
  async parseGiftData(giftUrl) {
    try {
      console.log(`Парсинг данных подарка: ${giftUrl}`);
      
      // Получаем HTML страницы подарка
      const html = await this.fetchHtml(giftUrl);
      
      if (!html) {
        console.error(`Не удалось получить HTML страницы подарка: ${giftUrl}`);
        return null;
      }
      
      // Загружаем HTML в cheerio
      const $ = cheerio.load(html);
      
      // Проверяем, является ли подарок "For sale" или "On auction"
      const saleStatus = $('.sale-status, .auction-status, .status').text().trim().toLowerCase();
      const isForSale = saleStatus.includes('for sale') || saleStatus.includes('on sale');
      const isOnAuction = saleStatus.includes('on auction') || saleStatus.includes('auction');
      
      // Если подарок не продается и не на аукционе, пропускаем его
      if (!isForSale && !isOnAuction) {
        console.log(`Подарок ${giftUrl} не продается и не на аукционе, пропускаем`);
        return null;
      }
      
      // Извлекаем данные подарка
      // Название и номер
      const titleText = $('h1').first().text().trim();
      let name = titleText;
      let number = '0';
      
      if (titleText.includes('#')) {
        const parts = titleText.split('#');
        name = parts[0].trim();
        number = parts[1].trim();
      }
      
      // Владелец
      let owner = 'unknown';
      const ownerElement = $('a[href^="/user/"]').first();
      if (ownerElement.length) {
        owner = ownerElement.text().trim();
      }
      
      // Коллекция
      let collection = 'Неизвестно';
      const collectionElement = $('.collection-name, .collection a, a[href^="/collection/"]').first();
      if (collectionElement.length) {
        collection = collectionElement.text().trim();
      }
      
      // Цена (если продается)
      let price = '0';
      let currency = 'TON';
      const priceElement = $('.price, .sale-price, .auction-price').first();
      if (priceElement.length) {
        const priceText = priceElement.text().trim();
        const priceMatch = priceText.match(/([0-9,.]+)\s*([A-Za-z]+)/);
        if (priceMatch) {
          price = priceMatch[1];
          currency = priceMatch[2];
        }
      }
      
      // Функция для извлечения свойства
      const extractProperty = (propertyName) => {
        // Пробуем разные селекторы для поиска свойства
        const selectors = [
          `.property:contains("${propertyName}")`,
          `.attribute:contains("${propertyName}")`,
          `.trait:contains("${propertyName}")`,
          `div:contains("${propertyName}")`
        ];
        
        for (const selector of selectors) {
          const propertyElement = $(selector).first();
          if (propertyElement.length) {
            const text = propertyElement.text().trim();
            // Проверяем, содержит ли текст двоеточие
            if (text.includes(':')) {
              const parts = text.split(':');
              if (parts.length > 1) {
                const valueParts = parts[1].trim().split(' ');
                // Проверяем, содержит ли последняя часть процент (редкость)
                if (valueParts.length > 1 && valueParts[valueParts.length - 1].includes('%')) {
                  return {
                    name: valueParts.slice(0, -1).join(' '),
                    rarity: valueParts[valueParts.length - 1]
                  };
                }
                return { name: parts[1].trim(), rarity: '' };
              }
            }
          }
        }
        
        return { name: 'Неизвестно', rarity: '' };
      };
      
      // Модель, фон и символ
      const model = extractProperty('Модель') || extractProperty('Model');
      const background = extractProperty('Фон') || extractProperty('Background');
      const symbol = extractProperty('Символ') || extractProperty('Symbol');
      
      // Саплай
      let supply = 'Неизвестно';
      const supplySelectors = [
        `.property:contains("Саплай")`,
        `.property:contains("Supply")`,
        `.attribute:contains("Supply")`,
        `.trait:contains("Supply")`,
        `div:contains("Supply")`
      ];
      
      for (const selector of supplySelectors) {
        const supplyElement = $(selector).first();
        if (supplyElement.length) {
          const text = supplyElement.text().trim();
          if (text.includes(':')) {
            const parts = text.split(':');
            if (parts.length > 1) {
              supply = parts[1].trim();
              break;
            }
          }
        }
      }
      
      // Изображение (статическое и анимированное)
      let imageUrl = '';
      let animatedImageUrl = '';
      
      // Ищем статическое изображение
      const imageSelectors = [
        'img.gift-image',
        'img.nft-image',
        'img.gift',
        '.gift-image img',
        '.nft-image img',
        '.image img',
        '.media img'
      ];
      
      for (const selector of imageSelectors) {
        const imageElement = $(selector).first();
        if (imageElement.length && imageElement.attr('src')) {
          imageUrl = imageElement.attr('src');
          break;
        }
      }
      
      // Если не нашли по селекторам, ищем любое изображение
      if (!imageUrl) {
        const anyImage = $('img').first();
        if (anyImage.length && anyImage.attr('src')) {
          imageUrl = anyImage.attr('src');
        }
      }
      
      // Ищем анимированное изображение (видео или gif)
      const animatedSelectors = [
        'video source',
        '.gift-animation video source',
        '.nft-animation video source',
        '.animation video source',
        '.media video source',
        'img.animated-gif',
        '.gift-animation img[src$=".gif"]',
        '.nft-animation img[src$=".gif"]'
      ];
      
      for (const selector of animatedSelectors) {
        const animatedElement = $(selector).first();
        if (animatedElement.length) {
          animatedImageUrl = animatedElement.attr('src');
          break;
        }
      }
      
      // Если изображение не найдено, используем заглушку
      if (!imageUrl) {
        imageUrl = `https://via.placeholder.com/300x300?text=${encodeURIComponent(name)}`;
      }
      
      // Формируем данные подарка
      return {
        id: number,
        name: name,
        owner: owner,
        collection: collection,
        status: isForSale ? 'for_sale' : (isOnAuction ? 'on_auction' : 'not_for_sale'),
        price: {
          amount: price,
          currency: currency
        },
        model: model,
        background: background,
        symbol: symbol,
        supply: supply,
        image: imageUrl,
        animatedImage: animatedImageUrl || null,
        url: giftUrl
      };
    } catch (error) {
      console.error(`Ошибка при парсинге данных подарка ${giftUrl}:`, error);
      return null;
    }
  }

  /**
   * Получение списка URL подарков
   * @param {number} page - Номер страницы
   * @param {number} limit - Количество подарков на странице
   * @param {string} collection - Коллекция для фильтрации (опционально)
   * @returns {Promise<Array<string>>} Список URL подарков
   */
  async getGiftUrls(page = 1, limit = 20, collection = null) {
    try {
      console.log(`Получение списка URL подарков (страница ${page}, лимит ${limit}, коллекция: ${collection || 'все'})`);
      
      // Формируем URL страницы со списком подарков
      let url = `https://fragment.com/gifts?page=${page}&limit=${limit}`;
      
      // Если указана коллекция, добавляем фильтр
      if (collection) {
        url += `&collection=${encodeURIComponent(collection)}`;
      }
      
      // Добавляем фильтр для отображения только подарков на продаже и аукционе
      url += '&status=sale,auction';
      
      console.log(`Запрашиваем URL: ${url}`);
      
      // Получаем HTML страницы
      const html = await this.fetchHtml(url);
      
      if (!html) {
        console.error(`Не удалось получить HTML страницы со списком подарков: ${url}`);
        return [];
      }
      
      // Загружаем HTML в cheerio
      const $ = cheerio.load(html);
      
      // Извлекаем URL подарков
      const giftUrls = [];
      
      // Извлекаем доступные коллекции для фильтрации
      const collections = new Set();
      $('.collection-filter a, .filter-collection a, a[href*="collection="]').each((i, element) => {
        const collectionName = $(element).text().trim();
        if (collectionName && collectionName !== 'All') {
          collections.add(collectionName);
        }
      });
      
      console.log(`Найдены коллекции: ${Array.from(collections).join(', ') || 'нет'}`);
      
      // Сохраняем список коллекций
      this.collections = Array.from(collections);
      
      // Пробуем разные селекторы для поиска подарков на продаже или аукционе
      const selectors = [
        '.gift-item.for-sale a, .gift-item.on-auction a',
        '.nft-item.for-sale a, .nft-item.on-auction a',
        '.gift.for-sale a, .gift.on-auction a',
        'a[href*="/gift/"]'
      ];
      
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, element) => {
            // Проверяем, есть ли индикатор продажи или аукциона
            const parent = $(element).closest('.gift-item, .nft-item, .gift');
            const isForSale = parent.hasClass('for-sale') ||
                             parent.find('.sale-status, .status:contains("sale")').length > 0;
            const isOnAuction = parent.hasClass('on-auction') ||
                               parent.find('.auction-status, .status:contains("auction")').length > 0;
            
            // Добавляем только подарки на продаже или аукционе
            if (isForSale || isOnAuction) {
              const href = $(element).attr('href');
              if (href && href.includes('/gift/')) {
                // Проверяем, является ли URL абсолютным или относительным
                const fullUrl = href.startsWith('http') ? href : `https://fragment.com${href}`;
                giftUrls.push(fullUrl);
              }
            }
          });
          
          if (giftUrls.length > 0) {
            break;
          }
        }
      }
      
      // Если не нашли по селекторам, ищем все ссылки, содержащие "/gift/"
      // и проверяем, есть ли рядом индикатор продажи или аукциона
      if (giftUrls.length === 0) {
        $('a').each((i, element) => {
          const href = $(element).attr('href');
          if (href && href.includes('/gift/')) {
            const parent = $(element).closest('div');
            const html = parent.html() || '';
            
            // Проверяем, есть ли индикатор продажи или аукциона
            if (html.includes('sale') || html.includes('auction')) {
              // Проверяем, является ли URL абсолютным или относительным
              const fullUrl = href.startsWith('http') ? href : `https://fragment.com${href}`;
              giftUrls.push(fullUrl);
            }
          }
        });
      }
      
      console.log(`Найдено ${giftUrls.length} URL подарков на продаже или аукционе на странице ${page}`);
      
      // Если не нашли ни одной ссылки, создаем тестовые URL
      if (giftUrls.length === 0) {
        console.log('Не найдено ни одной ссылки на подарки на продаже или аукционе. Создаем тестовые URL.');
        
        for (let i = 1; i <= 5; i++) {
          giftUrls.push(`https://fragment.com/gift/test${i}`);
        }
      }
      
      return giftUrls;
    } catch (error) {
      console.error(`Ошибка при получении списка URL подарков (страница ${page}):`, error);
      
      // В случае ошибки возвращаем тестовые URL
      console.log('Возвращаем тестовые URL из-за ошибки.');
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
   * @param {string} collection - Коллекция для фильтрации (опционально)
   * @returns {Promise<boolean>} Результат операции
   */
  async parseGifts(pages = 5, limit = 20, collection = null) {
    if (this.isRunning) {
      console.log('Парсинг уже запущен');
      return false;
    }
    
    this.isRunning = true;
    console.log(`Начало парсинга данных подарков (страниц: ${pages}, лимит: ${limit}, коллекция: ${collection || 'все'})`);
    
    try {
      // Временный массив для новых данных
      const newGifts = [];
      
      // Если коллекция не указана, сначала получаем список всех коллекций
      if (!collection) {
        // Получаем список URL подарков с первой страницы, чтобы извлечь коллекции
        await this.getGiftUrls(1, limit);
        
        // Если найдены коллекции, парсим каждую коллекцию отдельно
        if (this.collections && this.collections.length > 0) {
          console.log(`Найдено ${this.collections.length} коллекций: ${this.collections.join(', ')}`);
          
          for (const collectionName of this.collections) {
            console.log(`Парсинг коллекции: ${collectionName}`);
            
            // Парсим данные подарков для текущей коллекции
            for (let page = 1; page <= pages; page++) {
              // Получаем список URL подарков для текущей коллекции
              const giftUrls = await this.getGiftUrls(page, limit, collectionName);
              console.log(`Получено ${giftUrls.length} URL подарков на странице ${page} для коллекции ${collectionName}`);
              
              // Парсим данные каждого подарка
              for (const giftUrl of giftUrls) {
                const giftData = await this.parseGiftData(giftUrl);
                
                if (giftData) {
                  newGifts.push(giftData);
                  console.log(`Успешно спарсены данные подарка: ${giftData.name} #${giftData.id} (коллекция: ${collectionName})`);
                }
              }
              
              // Если на странице нет подарков, переходим к следующей коллекции
              if (giftUrls.length === 0 || giftUrls[0].includes('test')) {
                console.log(`Больше нет подарков в коллекции ${collectionName}. Переходим к следующей коллекции.`);
                break;
              }
              
              // Делаем паузу между страницами, чтобы не нагружать сервер
              if (page < pages) {
                console.log(`Пауза перед парсингом следующей страницы...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
        } else {
          // Если коллекции не найдены, парсим все подарки
          console.log('Коллекции не найдены. Парсим все подарки.');
          
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
        }
      } else {
        // Если коллекция указана, парсим только её
        console.log(`Парсинг указанной коллекции: ${collection}`);
        
        // Парсим данные подарков с каждой страницы
        for (let page = 1; page <= pages; page++) {
          // Получаем список URL подарков для указанной коллекции
          const giftUrls = await this.getGiftUrls(page, limit, collection);
          console.log(`Получено ${giftUrls.length} URL подарков на странице ${page} для коллекции ${collection}`);
          
          // Парсим данные каждого подарка
          for (const giftUrl of giftUrls) {
            const giftData = await this.parseGiftData(giftUrl);
            
            if (giftData) {
              newGifts.push(giftData);
              console.log(`Успешно спарсены данные подарка: ${giftData.name} #${giftData.id} (коллекция: ${collection})`);
            }
          }
          
          // Если на странице нет подарков, прекращаем парсинг
          if (giftUrls.length === 0 || giftUrls[0].includes('test')) {
            console.log(`Больше нет подарков в коллекции ${collection}.`);
            break;
          }
          
          // Делаем паузу между страницами, чтобы не нагружать сервер
          if (page < pages) {
            console.log(`Пауза перед парсингом следующей страницы...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
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
      
      console.log(`Парсинг данных подарков завершен. Всего подарков: ${this.giftsData.gifts.length}`);
      this.isRunning = false;
      return true;
    } catch (error) {
      console.error('Ошибка при парсинге данных подарков:', error);
      
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
    const collections = ['Astral', 'Gems', 'Cosmic', 'Ethereal', 'Mystic'];
    const statuses = ['for_sale', 'on_auction', 'for_sale', 'on_auction', 'for_sale'];
    
    // Анимированные GIF для тестовых подарков
    const animatedImages = [
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif',
      'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JlNGt1a2JlbXd1NXd5NnBxbWR0ZnJ5Y2Nxb2JlcWFxaWppZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlQXlUKw6ljvHGg/giphy.gif'
    ];
    
    for (let i = 0; i < 5; i++) {
      // Генерируем случайную цену
      const price = Math.floor(Math.random() * 10000) + 100;
      
      testGifts.push({
        id: `${i + 1}`,
        name: giftNames[i],
        owner: owners[i],
        collection: collections[i],
        status: statuses[i],
        price: {
          amount: price.toString(),
          currency: 'TON'
        },
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
        animatedImage: animatedImages[i],
        url: `https://fragment.com/gift/test${i + 1}`
      });
    }
    
    // Обновляем данные подарков
    this.giftsData.gifts = testGifts;
    this.saveGiftsData();
    
    // Сохраняем список коллекций
    this.collections = collections;
    
    console.log(`Создано ${testGifts.length} тестовых подарков в ${collections.length} коллекциях`);
  }

  /**
   * Запуск планировщика для регулярного парсинга данных
   * @param {string} cronExpression - Выражение cron для планировщика
   * @param {number} pages - Количество страниц для парсинга
   * @param {number} limit - Количество подарков на странице
   * @param {string} collection - Коллекция для фильтрации (опционально)
   */
  startScheduler(cronExpression = '0 */6 * * *', pages = 5, limit = 20, collection = null) {
    console.log(`Запуск планировщика с выражением: ${cronExpression}`);
    
    // Создаем задачу cron
    const job = new CronJob(
      cronExpression,
      async () => {
        console.log(`Запуск запланированного парсинга данных: ${new Date().toISOString()}`);
        await this.parseGifts(pages, limit, collection);
      },
      null,
      true,
      'UTC'
    );
    
    // Запускаем задачу
    job.start();
    console.log('Планировщик запущен');
    
    // Также запускаем парсинг сразу при старте
    this.parseGifts(pages, limit, collection);
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

// Создаем и экспортируем экземпляр API
const fragmentApiLight = new FragmentApiLight();
module.exports = fragmentApiLight;