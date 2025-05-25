// Инициализация Telegram Web App
const tgApp = window.Telegram.WebApp;

// Импортируем клиент для работы с Python-бэкендом
const fragmentClientPy = require('./fragment-client-py');

// Адаптация к теме Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tgApp.backgroundColor || '#0a0a1a');
document.documentElement.style.setProperty('--tg-theme-text-color', tgApp.textColor || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-hint-color', tgApp.hintColor || '#a0a0c0');
document.documentElement.style.setProperty('--tg-theme-link-color', tgApp.linkColor || '#9d71ea');
document.documentElement.style.setProperty('--tg-theme-button-color', tgApp.buttonColor || '#9d71ea');
document.documentElement.style.setProperty('--tg-theme-button-text-color', tgApp.buttonTextColor || '#ffffff');

// Убедимся, что все текстовые элементы используют правильные цвета
document.body.style.color = getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-text-color');

// Настройка Telegram Web App
tgApp.enableClosingConfirmation();

// Правильная инициализация viewport
tgApp.expand();

// Запрашиваем актуальные данные о viewport
tgApp.onEvent('viewportChanged', function(data) {
    // Устанавливаем CSS переменные для viewport
    document.documentElement.style.setProperty('--tg-viewport-height', `${data.height}px`);
    document.documentElement.style.setProperty('--tg-viewport-width', `${data.width}px`);
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${data.height}px`);
    
    // Обновляем стили для body и app-container
    document.body.style.height = `${data.height}px`;
    document.body.style.maxHeight = `${data.height}px`;
    document.body.style.overflow = 'hidden';
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.height = `${data.height}px`;
        appContainer.style.overflowY = 'auto';
        appContainer.style.overflowX = 'hidden';
    }
});

// Запрашиваем данные о viewport, если метод существует
if (typeof tgApp.requestViewport === 'function') {
    tgApp.requestViewport();
} else {
    console.log('Метод requestViewport не поддерживается в текущей версии Telegram Web App API');
}

// Сообщаем Telegram, что приложение готово
tgApp.ready();

// Получаем элементы DOM
const fragmentMode = document.getElementById('fragment-mode');
const starsstoreMode = document.getElementById('starsstore-mode');
const fragmentSection = document.getElementById('fragment-section');
const starsstoreSection = document.getElementById('starsstore-section');
const fragmentGiftList = document.getElementById('fragment-gift-list');
const starsstoreGiftList = document.getElementById('starsstore-gift-list');
const loader = document.getElementById('loader');
const mainNav = document.getElementById('main-nav');

// Глобальные переменные для работы с коллекциями и фильтрации
let currentMode = 'starsstore'; // По умолчанию показываем StarsStore Market
let selectedGift = null; // Выбранный подарок
let collections = []; // Список коллекций для фильтрации
let currentCollection = null; // Текущая выбранная коллекция

// Обновляем стиль кнопки "Главная" для соответствия общему дизайну
if (mainNav) {
    // Обновляем иконку и стиль
    const navArrow = mainNav.querySelector('.nav-arrow i');
    if (navArrow) {
        navArrow.className = 'fas fa-home';
    }
    
    // Добавляем обработчик для кнопки "Главная"
    mainNav.addEventListener('click', function() {
        console.log('Клик по кнопке "Главная"');
        window.location.href = 'index.html';
    });
} else {
    console.log('Кнопка "Главная" не найдена');
}

// Переключение режимов
function switchMode(mode) {
    // Обновляем классы кнопок
    fragmentMode.classList.toggle('active', mode === 'fragment');
    starsstoreMode.classList.toggle('active', mode === 'starsstore');

    // Обновляем видимость секций
    fragmentSection.classList.toggle('active', mode === 'fragment');
    starsstoreSection.classList.toggle('active', mode === 'starsstore');

    // Загружаем подарки для выбранного режима
    loadGifts(mode);
}

// Обработчики переключения режимов
fragmentMode.addEventListener('click', () => switchMode('fragment'));
starsstoreMode.addEventListener('click', () => switchMode('starsstore'));

// Загрузка подарков из соответствующего источника
async function loadGifts(mode, collection = null) {
    try {
        loader.style.display = 'flex';
        
        let gifts = [];
        
        // Сохраняем текущий режим и коллекцию
        currentMode = mode;
        currentCollection = collection;
        
        // В зависимости от режима, загружаем подарки из разных источников
        if (mode === 'fragment') {
            try {
                // Используем fragmentClientPy для получения подарков Fragment
                gifts = await fragmentClientPy.getFragmentGifts(currentCollection, 'available');
                console.log(`Получено ${gifts.length} подарков Fragment через Python-бэкенд`);
                
                // Получаем список коллекций для фильтрации
                try {
                    const collectionsData = await fragmentClientPy.getFragmentCollections();
                    console.log(`Получено ${collectionsData.length} коллекций Fragment`);
                    collections = collectionsData.map(col => col.name);
                } catch (collectionsError) {
                    console.error('Ошибка при получении коллекций Fragment:', collectionsError);
                    // Извлекаем список коллекций из подарков
                    collections = extractCollections(gifts);
                }
                
                // Если подарков нет, показываем уведомление
                if (gifts.length === 0) {
                    tgApp.showPopup({
                        title: 'Информация',
                        message: 'Подарки Fragment загружаются или отсутствуют в выбранной коллекции. Пожалуйста, проверьте позже или выберите другую коллекцию.',
                        buttons: [{type: 'ok'}]
                    });
                    
                    // Запускаем обновление данных Fragment
                    try {
                        await fragmentClientPy.startFragmentUpdate();
                        console.log('Запущено обновление данных Fragment');
                    } catch (updateError) {
                        console.error('Ошибка при запуске обновления данных Fragment:', updateError);
                    }
                }
                
                // Создаем фильтр коллекций
                createCollectionFilter(collections);
            } catch (apiError) {
                console.error('Ошибка при загрузке подарков Fragment через Python-бэкенд:', apiError);
                
                // Показываем уведомление об ошибке
                tgApp.showPopup({
                    title: 'Ошибка API',
                    message: 'Не удалось загрузить подарки Fragment. Пожалуйста, попробуйте позже.',
                    buttons: [{type: 'ok'}]
                });
                
                // Пробуем загрузить из локального JSON файла как запасной вариант
                try {
                    console.log('Пробуем загрузить из локального JSON файла как запасной вариант');
                    const response = await fetch('fragment_gifts.json');
                    const data = await response.json();
                    gifts = data.gifts || [];
                    
                    // Извлекаем список коллекций из подарков
                    collections = extractCollections(gifts);
                    
                    // Если указана коллекция, фильтруем подарки
                    if (collection) {
                        gifts = gifts.filter(gift => gift.collection === collection);
                    }
                    
                    // Фильтруем только подарки на продаже или аукционе
                    gifts = gifts.filter(gift => gift.status === 'for_sale' || gift.status === 'on_auction');
                    
                    // Создаем фильтр коллекций
                    createCollectionFilter(collections);
                    
                    // Запускаем обновление данных Fragment в фоне
                    fragmentClientPy.startFragmentUpdate()
                        .then(() => console.log('Фоновое обновление данных Fragment запущено'))
                        .catch(err => console.error('Ошибка при запуске фонового обновления данных Fragment:', err));
                } catch (fallbackError) {
                    console.error('Ошибка при загрузке из локального JSON файла:', fallbackError);
                    gifts = [];
                    collections = [];
                }
            }
        } else {
            // Для StarsStore Market используем JSON файл
            console.log('Загружаем подарки StarsStore из файла:', `${mode}_gifts.json`);
            try {
                const response = await fetch(`${mode}_gifts.json`);
                console.log('Ответ получен:', response);
                const data = await response.json();
                console.log('Данные StarsStore:', data);
                gifts = data.gifts;
                console.log('Подарки StarsStore:', gifts);
                
                // Скрываем фильтр коллекций для StarsStore
                hideCollectionFilter();
            } catch (error) {
                console.error('Ошибка при загрузке подарков StarsStore:', error);
                gifts = [];
            }
        }
        
        console.log(`Отрисовываем ${gifts.length} подарков для режима ${mode}`);
        renderGifts(gifts, mode);
    } catch (error) {
        console.error(`Ошибка при загрузке подарков ${mode}:`, error);
        tgApp.showPopup({
            title: 'Ошибка',
            message: 'Не удалось загрузить список подарков',
            buttons: [{type: 'ok'}]
        });
    } finally {
        loader.style.display = 'none';
    }
}

// Извлечение списка коллекций из подарков
function extractCollections(gifts) {
    const collectionsSet = new Set();
    
    // Добавляем все коллекции из подарков
    gifts.forEach(gift => {
        if (gift.collection) {
            collectionsSet.add(gift.collection);
        }
    });
    
    // Преобразуем Set в массив и сортируем
    return Array.from(collectionsSet).sort();
}

// Создание фильтра коллекций
function createCollectionFilter(collectionsList) {
    // Находим или создаем контейнер для фильтра
    let filterContainer = document.getElementById('collection-filter');
    
    if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.id = 'collection-filter';
        filterContainer.className = 'collection-filter';
        
        // Добавляем контейнер перед списком подарков
        fragmentGiftList.parentNode.insertBefore(filterContainer, fragmentGiftList);
    }
    
    // Очищаем контейнер
    filterContainer.innerHTML = '';
    
    // Добавляем заголовок
    const filterTitle = document.createElement('h3');
    filterTitle.textContent = 'Коллекции';
    filterContainer.appendChild(filterTitle);
    
    // Создаем список коллекций
    const filterList = document.createElement('div');
    filterList.className = 'collection-filter-list';
    
    // Добавляем опцию "Все коллекции"
    const allOption = document.createElement('div');
    allOption.className = `collection-filter-item ${currentCollection === null ? 'active' : ''}`;
    allOption.textContent = 'Все коллекции';
    allOption.addEventListener('click', () => {
        loadGifts('fragment', null);
    });
    filterList.appendChild(allOption);
    
    // Добавляем опции для каждой коллекции
    collectionsList.forEach(collection => {
        const option = document.createElement('div');
        option.className = `collection-filter-item ${currentCollection === collection ? 'active' : ''}`;
        option.textContent = collection;
        option.addEventListener('click', () => {
            loadGifts('fragment', collection);
        });
        filterList.appendChild(option);
    });
    
    // Добавляем список в контейнер
    filterContainer.appendChild(filterList);
    
    // Показываем фильтр
    filterContainer.style.display = 'block';
}

// Скрытие фильтра коллекций
function hideCollectionFilter() {
    const filterContainer = document.getElementById('collection-filter');
    if (filterContainer) {
        filterContainer.style.display = 'none';
    }
}

// Функция для получения URL изображения подарка
function getGiftImageUrl(gift) {
    // Используем изображение из JSON-файла, если оно есть
    if (gift.image) {
        return gift.image;
    }
    
    // Запасной вариант, если изображение не указано
    return `https://via.placeholder.com/300x300?text=${encodeURIComponent(gift.name)}`;
}

// Отрисовка подарков
function renderGifts(gifts, mode) {
    const giftList = mode === 'fragment' ? fragmentGiftList : starsstoreGiftList;
    giftList.innerHTML = '';
    
    if (!gifts || gifts.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-gifts-message';
        emptyMessage.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>Нет доступных подарков</p>
        `;
        giftList.appendChild(emptyMessage);
        return;
    }
    
    gifts.forEach(gift => {
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-item animate__animated animate__fadeIn';
        giftElement.setAttribute('data-gift-id', gift.id);
        giftElement.setAttribute('data-market', mode);
        
        // Добавляем обработчик клика для просмотра деталей подарка
        giftElement.addEventListener('click', (event) => {
            // Проверяем, был ли клик по кнопке переключения анимации
            if (event.target.closest('.animation-toggle')) {
                event.stopPropagation(); // Предотвращаем всплытие события
                
                // Переключаем класс для анимации
                const imageContainer = event.target.closest('.gift-image');
                if (imageContainer) {
                    imageContainer.classList.toggle('show-animation');
                    
                    // Меняем иконку
                    const toggleIcon = event.target.closest('.animation-toggle').querySelector('i');
                    if (toggleIcon) {
                        if (imageContainer.classList.contains('show-animation')) {
                            toggleIcon.className = 'fas fa-pause';
                        } else {
                            toggleIcon.className = 'fas fa-play';
                        }
                    }
                }
                return;
            }
            
            // Обычный клик по подарку - показываем детали
            showGiftDetails(gift, mode);
        });
        
        // Формируем HTML в зависимости от режима
        if (mode === 'fragment') {
            // Добавляем класс для статуса (продажа или аукцион)
            if (gift.status === 'for_sale') {
                giftElement.classList.add('for-sale');
            } else if (gift.status === 'on_auction') {
                giftElement.classList.add('on-auction');
            }
            
            // Определяем, есть ли анимированное изображение
            const hasAnimation = gift.animatedImage && gift.animatedImage.length > 0;
            
            giftElement.innerHTML = `
                <div class="gift-image ${hasAnimation ? 'has-animation' : ''}">
                    <img src="${getGiftImageUrl(gift)}" alt="${gift.name}" class="static-image" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'fas fa-gem\\'></i>';">
                    ${hasAnimation ? `
                        <div class="animated-image">
                            ${gift.animatedImage.endsWith('.gif') 
                                ? `<img src="${gift.animatedImage}" alt="${gift.name} (animated)" class="gif-animation">` 
                                : `<video autoplay loop muted playsinline class="video-animation">
                                    <source src="${gift.animatedImage}" type="video/mp4">
                                  </video>`
                            }
                        </div>
                        <div class="animation-toggle">
                            <i class="fas fa-play"></i>
                        </div>
                    ` : ''}
                </div>
                <div class="gift-status">
                    ${gift.status === 'for_sale' ? '<span class="sale-badge">Продажа</span>' : ''}
                    ${gift.status === 'on_auction' ? '<span class="auction-badge">Аукцион</span>' : ''}
                </div>
                <div class="gift-info-preview">
                    <h3>${gift.name}</h3>
                    <div class="gift-details-preview">
                        <span class="gift-owner">@${gift.owner || 'unknown'}</span>
                        <span class="gift-supply">${gift.supply || ''}</span>
                        ${gift.collection ? `<span class="gift-collection">${gift.collection}</span>` : ''}
                    </div>
                    ${gift.price && gift.price.amount ? `
                        <div class="gift-price">
                            <span>${gift.price.amount} ${gift.price.currency || 'TON'}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="gift-id">#${gift.id}</div>
            `;
        } else {
            // Для StarsStore используем другой формат
            giftElement.innerHTML = `
                <div class="gift-image">
                    <img src="${getGiftImageUrl(gift)}" alt="${gift.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'fas fa-star\\'></i>';">
                </div>
                <div class="gift-info-preview">
                    <h3>${gift.name}</h3>
                    <div class="gift-details-preview">
                        <span class="gift-price">${gift.price} ⭐</span>
                    </div>
                </div>
                <div class="gift-id">#${gift.id}</div>
            `;
        }
        
        giftList.appendChild(giftElement);
    });
}

// Показ деталей подарка
function showGiftDetails(gift, mode) {
    console.log(`Показ деталей подарка ${gift.id} из ${mode}`);
    selectedGift = gift;
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'gift-details-modal';
    
    // Формируем содержимое модального окна
    let modalContent = '';
    
    if (mode === 'fragment') {
        // Определяем, есть ли анимированное изображение
        const hasAnimation = gift.animatedImage && gift.animatedImage.length > 0;
        
        modalContent = `
            <div class="gift-details-content">
                <div class="gift-details-close">
                    <i class="fas fa-times"></i>
                </div>
                <div class="gift-details-image ${hasAnimation ? 'has-animation' : ''}">
                    <img src="${getGiftImageUrl(gift)}" alt="${gift.name}" class="static-image">
                    ${hasAnimation ? `
                        <div class="animated-image show-animation">
                            ${gift.animatedImage.endsWith('.gif') 
                                ? `<img src="${gift.animatedImage}" alt="${gift.name} (animated)" class="gif-animation">` 
                                : `<video autoplay loop muted playsinline class="video-animation">
                                    <source src="${gift.animatedImage}" type="video/mp4">
                                  </video>`
                            }
                        </div>
                    ` : ''}
                </div>
                <div class="gift-details-info">
                    <h2>${gift.name} #${gift.id}</h2>
                    <p><strong>Владелец:</strong> @${gift.owner || 'unknown'}</p>
                    <p><strong>Коллекция:</strong> ${gift.collection || 'Неизвестно'}</p>
                    <p><strong>Статус:</strong> ${gift.status === 'for_sale' ? 'На продаже' : (gift.status === 'on_auction' ? 'На аукционе' : 'Не продается')}</p>
                    ${gift.price && gift.price.amount ? `<p><strong>Цена:</strong> ${gift.price.amount} ${gift.price.currency || 'TON'}</p>` : ''}
                    <p><strong>Саплай:</strong> ${gift.supply || 'Неизвестно'}</p>
                </div>
                <div class="gift-details-rarity">
                    <div class="rarity-item">
                        <div class="rarity-item-title">Модель</div>
                        <div class="rarity-item-value">
                            ${gift.model ? gift.model.name : 'Неизвестно'}
                            ${gift.model && gift.model.rarity ? `<span class="rarity-percentage">${gift.model.rarity}</span>` : ''}
                        </div>
                    </div>
                    <div class="rarity-item">
                        <div class="rarity-item-title">Фон</div>
                        <div class="rarity-item-value">
                            ${gift.background ? gift.background.name : 'Неизвестно'}
                            ${gift.background && gift.background.rarity ? `<span class="rarity-percentage">${gift.background.rarity}</span>` : ''}
                        </div>
                    </div>
                    <div class="rarity-item">
                        <div class="rarity-item-title">Символ</div>
                        <div class="rarity-item-value">
                            ${gift.symbol ? gift.symbol.name : 'Неизвестно'}
                            ${gift.symbol && gift.symbol.rarity ? `<span class="rarity-percentage">${gift.symbol.rarity}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="gift-details-actions">
                    <button class="gift-details-button primary" onclick="window.open('${gift.url}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Открыть на Fragment
                    </button>
                </div>
            </div>
        `;
    } else {
        // Для StarsStore используем другой формат
        modalContent = `
            <div class="gift-details-content">
                <div class="gift-details-close">
                    <i class="fas fa-times"></i>
                </div>
                <div class="gift-details-image">
                    <img src="${getGiftImageUrl(gift)}" alt="${gift.name}">
                </div>
                <div class="gift-details-info">
                    <h2>${gift.name} #${gift.id}</h2>
                    <p><strong>Цена:</strong> ${gift.price} ⭐</p>
                    <p><strong>Описание:</strong> ${gift.description || 'Нет описания'}</p>
                </div>
                <div class="gift-details-actions">
                    <button class="gift-details-button primary" onclick="buyGift('${gift.id}', '${mode}')">
                        <i class="fas fa-shopping-cart"></i> Купить за ${gift.price} ⭐
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Добавляем обработчик для закрытия модального окна
    const closeButton = modal.querySelector('.gift-details-close');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });
    
    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// Покупка подарка
async function buyGift(giftId, mode) {
    console.log(`Покупка подарка ${giftId} из ${mode}`);
    
    // Показываем подтверждение
    tgApp.showConfirm(
        'Подтверждение покупки',
        `Вы уверены, что хотите купить подарок #${giftId}?`,
        (confirmed) => {
            if (confirmed) {
                // Показываем индикатор загрузки
                loader.style.display = 'flex';
                
                // Имитируем запрос к серверу
                setTimeout(() => {
                    // Скрываем индикатор загрузки
                    loader.style.display = 'none';
                    
                    // Показываем уведомление об успешной покупке
                    tgApp.showPopup({
                        title: 'Успех',
                        message: `Подарок #${giftId} успешно куплен!`,
                        buttons: [{type: 'ok'}]
                    });
                    
                    // Закрываем модальное окно
                    const modal = document.querySelector('.gift-details-modal');
                    if (modal) {
                        modal.remove();
                    }
                    
                    // Обновляем список подарков
                    loadGifts(mode);
                }, 1500);
            }
        }
    );
}

// Загружаем подарки при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем подарки для режима по умолчанию
    switchMode(currentMode);
});
