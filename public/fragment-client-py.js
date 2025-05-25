/**
 * Fragment Client для работы с Python-бэкендом
 * 
 * Клиент для взаимодействия с Python-бэкендом, использующим библиотеку ton-fragments
 */

class FragmentClientPy {
    constructor() {
        // Получаем URL бэкенда из переменных окружения или используем значение по умолчанию
        this.backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
        
        // Кэш для данных подарков
        this.giftsCache = null;
        this.lastCacheUpdate = null;
        
        // Максимальное время жизни кэша в миллисекундах (10 минут)
        this.cacheLifetime = 10 * 60 * 1000;
        
        console.log(`FragmentClientPy инициализирован с URL: ${this.backendUrl}`);
    }
    
    /**
     * Получение списка подарков Fragment
     * @param {string} collection - Коллекция для фильтрации (опционально)
     * @param {string} status - Статус подарков для фильтрации (опционально)
     * @returns {Promise<Array>} Список подарков
     */
    async getFragmentGifts(collection = null, status = 'available') {
        try {
            console.log(`Получение списка подарков Fragment (коллекция: ${collection || 'все'}, статус: ${status || 'все'})`);
            
            // Проверяем, есть ли актуальный кэш
            if (this.giftsCache && this.lastCacheUpdate && (Date.now() - this.lastCacheUpdate < this.cacheLifetime)) {
                console.log('Используем кэшированные данные подарков');
                
                // Фильтруем кэшированные данные
                let filteredGifts = [...this.giftsCache];
                
                if (collection) {
                    filteredGifts = filteredGifts.filter(gift => gift.collection === collection);
                }
                
                if (status === 'for_sale') {
                    filteredGifts = filteredGifts.filter(gift => gift.status === 'for_sale');
                } else if (status === 'on_auction') {
                    filteredGifts = filteredGifts.filter(gift => gift.status === 'on_auction');
                } else if (status === 'available') {
                    filteredGifts = filteredGifts.filter(gift => gift.status === 'for_sale' || gift.status === 'on_auction');
                }
                
                return filteredGifts;
            }
            
            // Формируем URL с параметрами
            let url = `${this.backendUrl}/api/fragment/gifts`;
            const params = new URLSearchParams();
            
            if (collection) {
                params.append('collection', collection);
            }
            
            if (status) {
                params.append('status', status);
            }
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            // Выполняем запрос к бэкенду
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            // Обновляем кэш, если получили данные не из кэша
            if (!data.fromCache) {
                this.giftsCache = data.gifts;
                this.lastCacheUpdate = Date.now();
            }
            
            console.log(`Получено ${data.gifts.length} подарков Fragment`);
            return data.gifts;
        } catch (error) {
            console.error('Ошибка при получении списка подарков Fragment:', error);
            return [];
        }
    }
    
    /**
     * Получение подарка Fragment по ID
     * @param {string} giftId - ID подарка
     * @returns {Promise<Object|null>} Данные подарка
     */
    async getFragmentGiftById(giftId) {
        try {
            console.log(`Получение подарка Fragment с ID: ${giftId}`);
            
            // Проверяем, есть ли подарок в кэше
            if (this.giftsCache && this.lastCacheUpdate && (Date.now() - this.lastCacheUpdate < this.cacheLifetime)) {
                const cachedGift = this.giftsCache.find(gift => gift.id === giftId);
                
                if (cachedGift) {
                    console.log('Используем кэшированные данные подарка');
                    return cachedGift;
                }
            }
            
            // Выполняем запрос к бэкенду
            const response = await fetch(`${this.backendUrl}/api/fragment/gifts/${giftId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            console.log(`Получены данные подарка Fragment с ID: ${giftId}`);
            return data.gift;
        } catch (error) {
            console.error(`Ошибка при получении подарка Fragment с ID ${giftId}:`, error);
            return null;
        }
    }
    
    /**
     * Получение списка коллекций Fragment
     * @returns {Promise<Array>} Список коллекций
     */
    async getFragmentCollections() {
        try {
            console.log('Получение списка коллекций Fragment');
            
            // Выполняем запрос к бэкенду
            const response = await fetch(`${this.backendUrl}/api/fragment/collections`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            console.log(`Получено ${data.collections.length} коллекций Fragment`);
            return data.collections;
        } catch (error) {
            console.error('Ошибка при получении списка коллекций Fragment:', error);
            return [];
        }
    }
    
    /**
     * Запуск обновления данных Fragment
     * @returns {Promise<boolean>} Результат операции
     */
    async startFragmentUpdate() {
        try {
            console.log('Запуск обновления данных Fragment');
            
            // Выполняем запрос к бэкенду
            const response = await fetch(`${this.backendUrl}/api/fragment/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            // Сбрасываем кэш
            this.giftsCache = null;
            this.lastCacheUpdate = null;
            
            console.log('Обновление данных Fragment запущено успешно');
            return true;
        } catch (error) {
            console.error('Ошибка при запуске обновления данных Fragment:', error);
            return false;
        }
    }
    
    /**
     * Покупка подарка Fragment
     * @param {string} giftId - ID подарка
     * @param {string} recipient - Получатель подарка
     * @returns {Promise<Object>} Результат операции
     */
    async buyFragmentGift(giftId, recipient) {
        try {
            console.log(`Покупка подарка Fragment с ID ${giftId} для получателя ${recipient}`);
            
            // Выполняем запрос к бэкенду
            const response = await fetch(`${this.backendUrl}/api/fragment/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    giftId,
                    recipient
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }
            
            // Сбрасываем кэш
            this.giftsCache = null;
            this.lastCacheUpdate = null;
            
            console.log(`Подарок Fragment с ID ${giftId} успешно куплен для получателя ${recipient}`);
            return {
                success: true,
                message: data.message,
                transactionId: data.transactionId,
                isSimulated: data.isSimulated || false
            };
        } catch (error) {
            console.error(`Ошибка при покупке подарка Fragment с ID ${giftId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Создаем и экспортируем экземпляр клиента
const fragmentClientPy = new FragmentClientPy();
module.exports = fragmentClientPy;