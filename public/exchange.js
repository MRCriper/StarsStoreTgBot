// Инициализация Telegram Web App
const tgApp = window.Telegram.WebApp;

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
async function loadGifts(mode) {
    try {
        loader.style.display = 'flex';
        
        let gifts = [];
        
        // В зависимости от режима, загружаем подарки из разных источников
        if (mode === 'fragment') {
            try {
                // Используем fragmentClient для получения подарков Fragment
                gifts = await fragmentClient.getFragmentGifts();
                console.log(`Получено ${gifts.length} подарков Fragment через API`);
                
                // Если подарков нет, показываем уведомление
                if (gifts.length === 0) {
                    tgApp.showPopup({
                        title: 'Информация',
                        message: 'Подарки Fragment загружаются. Это может занять некоторое время. Пожалуйста, проверьте позже.',
                        buttons: [{type: 'ok'}]
                    });
                    
                    // Запускаем парсинг данных Fragment
                    try {
                        await fragmentClient.startFragmentParsing();
                        console.log('Запущен парсинг данных Fragment');
                    } catch (parsingError) {
                        console.error('Ошибка при запуске парсинга Fragment:', parsingError);
                    }
                }
            } catch (apiError) {
                console.error('Ошибка при загрузке подарков Fragment через API:', apiError);
                
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
                } catch (fallbackError) {
                    console.error('Ошибка при загрузке из локального JSON файла:', fallbackError);
                    gifts = [];
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
        
        // Получаем URL изображения для подарка
        const imageUrl = getGiftImageUrl(gift);
        
        // Формируем HTML в зависимости от режима
        if (mode === 'fragment') {
            // Для Fragment используем данные из парсера
            const modelRarity = gift.model && gift.model.rarity ? gift.model.rarity : '';
            const backgroundRarity = gift.background && gift.background.rarity ? gift.background.rarity : '';
            const symbolRarity = gift.symbol && gift.symbol.rarity ? gift.symbol.rarity : '';
            
            giftElement.innerHTML = `
                <div class="gift-image">
                    <img src="${imageUrl}" alt="${gift.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'fas fa-gem\\'></i>';">
                </div>
                <div class="gift-info-preview">
                    <h3>${gift.name}</h3>
                    <div class="gift-details-preview">
                        <span class="gift-owner">@${gift.owner || 'unknown'}</span>
                        <span class="gift-supply">${gift.supply || ''}</span>
                    </div>
                </div>
                <div class="gift-id">#${gift.id}</div>
            `;
        } else {
            // Для StarsStore используем стандартный формат
            giftElement.innerHTML = `
                <div class="gift-image">
                    <img src="${imageUrl}" alt="${gift.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'${gift.icon || 'fas fa-gift'}\\'></i>';">
                </div>
                <div class="gift-info-preview">
                    <h3>${gift.name}</h3>
                    <div class="gift-price-preview">
                        <span><i class="fas fa-star"></i> ${gift.price}</span>
                    </div>
                </div>
                <div class="gift-id">#${gift.id}</div>
            `;
        }

        // Добавляем обработчик клика на подарок для открытия модального окна
        giftElement.addEventListener('click', () => openGiftModal(gift, mode));

        giftList.appendChild(giftElement);
    });
}

// Функция открытия модального окна с подарком
function openGiftModal(gift, mode) {
    // Создаем модальное окно, если его еще нет
    let modalOverlay = document.querySelector('.gift-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'gift-modal-overlay';
        document.body.appendChild(modalOverlay);
    }
    
    const marketName = mode === 'fragment' ? 'SS_store' : 'внутренняя биржа SS_store';
    
    // Формируем содержимое модального окна в зависимости от режима
    let modalContent = '';
    
    if (mode === 'fragment') {
        // Для Fragment используем данные из парсера
        const modelName = gift.model && gift.model.name ? gift.model.name : 'Неизвестно';
        const modelRarity = gift.model && gift.model.rarity ? gift.model.rarity : '';
        
        const backgroundName = gift.background && gift.background.name ? gift.background.name : 'Неизвестно';
        const backgroundRarity = gift.background && gift.background.rarity ? gift.background.rarity : '';
        
        const symbolName = gift.symbol && gift.symbol.name ? gift.symbol.name : 'Неизвестно';
        const symbolRarity = gift.symbol && gift.symbol.rarity ? gift.symbol.rarity : '';
        
        modalContent = `
        <div class="gift-modal animate__animated animate__fadeIn">
            <div class="gift-modal-header">
                <h2>${gift.name}</h2>
                <div class="gift-id">#${gift.id}</div>
                <div class="gift-modal-share">
                    <i class="fas fa-share-alt"></i>
                </div>
            </div>
            <div class="gift-modal-image">
                <img src="${getGiftImageUrl(gift)}" alt="${gift.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'fas fa-gem\\'></i>';">
            </div>
            <div class="gift-modal-content">
                <div class="gift-modal-info">
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Владелец:</div>
                        <div class="gift-modal-info-value">@${gift.owner || 'unknown'}</div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Модель:</div>
                        <div class="gift-modal-info-value">${modelName} <span class="rarity-badge">${modelRarity}</span></div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Фон:</div>
                        <div class="gift-modal-info-value">${backgroundName} <span class="rarity-badge">${backgroundRarity}</span></div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Символ:</div>
                        <div class="gift-modal-info-value">${symbolName} <span class="rarity-badge">${symbolRarity}</span></div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Саплай:</div>
                        <div class="gift-modal-info-value">${gift.supply || 'Неизвестно'}</div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Маркет:</div>
                        <div class="gift-modal-info-value">${marketName}</div>
                    </div>
                </div>
                <div class="gift-modal-actions">
                    <button class="gift-modal-btn gift-modal-buy-btn" data-gift-id="${gift.id}">
                        <i class="fas fa-shopping-cart"></i> Купить
                    </button>
                    <button class="gift-modal-btn gift-modal-contact-btn" data-owner="${gift.owner}">
                        <i class="fas fa-envelope"></i> Написать владельцу
                    </button>
                    <button class="gift-modal-btn gift-modal-close-btn">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        </div>
        `;
    } else {
        // Для StarsStore используем стандартный формат
        modalContent = `
        <div class="gift-modal animate__animated animate__fadeIn">
            <div class="gift-modal-header">
                <h2>${gift.name}</h2>
                <div class="gift-id">#${gift.id}</div>
                <div class="gift-modal-share">
                    <i class="fas fa-share-alt"></i>
                </div>
            </div>
            <div class="gift-modal-image">
                <img src="${getGiftImageUrl(gift)}" alt="${gift.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Gift'; this.parentElement.innerHTML += '<i class=\\'${gift.icon || 'fas fa-gift'}\\'></i>';">
            </div>
            <div class="gift-modal-content">
                <div class="gift-modal-info">
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Цена:</div>
                        <div class="gift-modal-info-value"><i class="fas fa-star" style="color: var(--star-color);"></i> ${gift.price}</div>
                    </div>
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Маркет:</div>
                        <div class="gift-modal-info-value">${marketName}</div>
                    </div>
                    ${gift.seller ? `
                    <div class="gift-modal-info-row">
                        <div class="gift-modal-info-label">Продавец:</div>
                        <div class="gift-modal-info-value">${gift.seller}</div>
                    </div>` : ''}
                </div>
                <div class="gift-modal-description">
                    ${gift.description || ''}
                </div>
                <div class="gift-modal-actions">
                    <button class="gift-modal-btn gift-modal-buy-btn" data-gift-id="${gift.id}">
                        <i class="fas fa-shopping-cart"></i> Купить
                    </button>
                    ${gift.seller_id ? `
                    <button class="gift-modal-btn gift-modal-contact-btn" data-seller-id="${gift.seller_id}">
                        <i class="fas fa-envelope"></i> Написать продавцу
                    </button>` : ''}
                    <button class="gift-modal-btn gift-modal-close-btn">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        </div>
        `;
    }
    
    // Заполняем содержимое модального окна
    modalOverlay.innerHTML = modalContent;
    
    // Показываем модальное окно
    modalOverlay.classList.add('active');
    
    // Добавляем обработчики для кнопок
    const buyButton = modalOverlay.querySelector('.gift-modal-buy-btn');
    buyButton.addEventListener('click', () => buyGift(gift, mode));
    
    if (mode === 'fragment') {
        const contactButton = modalOverlay.querySelector('.gift-modal-contact-btn');
        contactButton.addEventListener('click', () => contactSeller(gift.seller_id));
    }
    
    const closeButton = modalOverlay.querySelector('.gift-modal-close-btn');
    closeButton.addEventListener('click', closeGiftModal);
    
    // Закрытие по клику на оверлей
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeGiftModal();
        }
    });
    
    // Добавляем обработчик для кнопки "Поделиться"
    const shareButton = modalOverlay.querySelector('.gift-modal-share');
    shareButton.addEventListener('click', () => shareGift(gift, mode));
}

// Функция закрытия модального окна
function closeGiftModal() {
    const modalOverlay = document.querySelector('.gift-modal-overlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        // Удаляем модальное окно после анимации
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
        }, 300);
    }
}

// Функция для поделиться подарком
function shareGift(gift, mode) {
    const marketName = mode === 'fragment' ? 'SS_store' : 'внутренняя биржа SS_store';
    const shareText = `Посмотри этот подарок в Stars Store: ${gift.name} (${gift.price} звёзд) на ${marketName}`;
    
    // Используем Telegram Web App API для поделиться
    if (tgApp.showShareButton) {
        tgApp.showShareButton();
        tgApp.onShareButtonClicked(() => {
            tgApp.shareMessage(shareText);
        });
    } else {
        // Если метод не поддерживается, показываем сообщение
        tgApp.showPopup({
            title: 'Поделиться',
            message: 'Функция "Поделиться" не поддерживается в текущей версии Telegram',
            buttons: [{type: 'ok'}]
        });
    }
}

// Функция покупки подарка
function buyGift(gift, mode) {
    const marketName = mode === 'fragment' ? 'SS_store' : 'внутренняя биржа SS_store';
    tgApp.showConfirm(
        `Вы хотите купить ${gift.name} за ${gift.price} звёзд на ${marketName}?`,
        (confirmed) => {
            if (confirmed) {
                // Отправляем данные о покупке в зависимости от режима
                const purchaseData = {
                    gift_id: gift.id,
                    price: gift.price,
                    market: mode,
                    ...(mode === 'fragment' && { seller_id: gift.seller_id })
                };

                // Здесь будет логика отправки данных на сервер
                console.log('Отправка данных о покупке:', purchaseData);

                tgApp.showPopup({
                    title: 'Покупка подарка',
                    message: `Подарок ${gift.name} успешно куплен на ${marketName}!`,
                    buttons: [{type: 'ok'}]
                });
                
                // Закрываем модальное окно после покупки
                closeGiftModal();
            }
        }
    );
}

// Функция для связи с продавцом (только для Fragment Market)
function contactSeller(sellerId) {
    // Здесь будет логика для связи с продавцом через Telegram
    console.log('Связь с продавцом:', sellerId);
    tgApp.showPopup({
        title: 'Связь с продавцом',
        message: 'Сейчас вы будете перенаправлены в чат с продавцом',
        buttons: [{type: 'ok'}]
    });
    
    // Закрываем модальное окно после нажатия на кнопку
    closeGiftModal();
}

// Загружаем подарки для начального режима (Fragment Market)
switchMode('fragment');
