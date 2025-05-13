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

// Запрашиваем данные о viewport
tgApp.requestViewport();

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

// Добавляем обработчик для кнопки "Главная"
mainNav.addEventListener('click', () => {
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
});

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
            // Для Fragment Market используем API
            try {
                // Получаем initData из Telegram WebApp
                const initData = window.Telegram.WebApp.initData;
                
                // Создаем заголовки для запроса
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Telegram-Web-App-Init-Data': initData
                };
                
                // Отправляем запрос к API для получения подарков Fragment Market
                const response = await fetch('/api/fragment-gifts', { headers });
                const data = await response.json();
                
                if (data.success) {
                    gifts = data.gifts;
                } else {
                    throw new Error(data.error || 'Не удалось загрузить подарки Fragment Market');
                }
            } catch (apiError) {
                console.error('Ошибка при загрузке подарков Fragment Market через API:', apiError);
                // Показываем уведомление об ошибке
                tgApp.showPopup({
                    title: 'Ошибка API',
                    message: 'Не удалось загрузить подарки Fragment Market. Пожалуйста, попробуйте позже.',
                    buttons: [{type: 'ok'}]
                });
                
                // Возвращаем пустой массив подарков
                gifts = [];
            }
        } else {
            // Для StarsStore Market используем JSON файл
            const response = await fetch(`${mode}_gifts.json`);
            const data = await response.json();
            gifts = data.gifts;
        }
        
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

// Отрисовка подарков
function renderGifts(gifts, mode) {
    const giftList = mode === 'fragment' ? fragmentGiftList : starsstoreGiftList;
    giftList.innerHTML = '';
    
    gifts.forEach(gift => {
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-item';
        giftElement.innerHTML = `
            <div class="gift-image">
                <i class="${gift.icon}"></i>
            </div>
            <div class="gift-info">
                <h3>${gift.name}</h3>
                <p>${gift.description}</p>
                <div class="gift-price">
                    <span><i class="fas fa-star"></i> ${gift.price}</span>
                </div>
                <div class="gift-market-info">
                    <span class="market-label">${mode === 'fragment' ? 'Fragment Market' : 'StarsStore Market'}</span>
                    ${mode === 'fragment' ? `<span class="seller-info">Продавец: ${gift.seller}</span>` : ''}
                </div>
            </div>
            <div class="gift-actions">
                <button class="buy-gift-btn" data-gift-id="${gift.id}">
                    <i class="fas fa-shopping-cart"></i> Купить
                </button>
                ${mode === 'fragment' ? `
                <button class="contact-seller-btn" data-seller-id="${gift.seller_id}">
                    <i class="fas fa-envelope"></i> Связаться
                </button>` : ''}
            </div>
        `;

        // Добавляем обработчики для кнопок
        const buyButton = giftElement.querySelector('.buy-gift-btn');
        buyButton.addEventListener('click', () => buyGift(gift, mode));

        if (mode === 'fragment') {
            const contactButton = giftElement.querySelector('.contact-seller-btn');
            contactButton.addEventListener('click', () => contactSeller(gift.seller_id));
        }

        giftList.appendChild(giftElement);
    });
}

// Функция покупки подарка
function buyGift(gift, mode) {
    const marketName = mode === 'fragment' ? 'Fragment Market' : 'StarsStore Market';
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
}

// Загружаем подарки для начального режима (Fragment Market)
switchMode('fragment');
