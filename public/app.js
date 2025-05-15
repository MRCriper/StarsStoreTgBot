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

// Определение платформы
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(navigator.userAgent);

// Добавляем класс для определения платформы
if (isIOS) {
    document.body.classList.add('ios-platform');
} else if (isAndroid) {
    document.body.classList.add('android-platform');
}

// Настройка Telegram Web App
tgApp.enableClosingConfirmation();
tgApp.expand();
tgApp.ready();

// Переменные для навигации между страницами
let currentPage = 'step-1';

// Получаем элементы DOM
const usernameInput = document.getElementById('username');
const starsInput = document.getElementById('stars');
const priceElement = document.getElementById('price');
const buyButton = document.getElementById('buy-button');
const customPackageBtn = document.getElementById('custom-package-btn');
const toStep2Btn = document.getElementById('to-step-2');
const backToStep1Btn = document.getElementById('back-to-step-1');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const summaryStars = document.getElementById('summary-stars');
const summaryPrice = document.getElementById('summary-price');
const packages = document.querySelectorAll('.package');
const loader = document.getElementById('loader');
const contactsDropdown = document.getElementById('contacts-dropdown');

// Элементы реферальной системы и биржи
const referralPage = document.getElementById('referral-page');
const referralNav = document.getElementById('referral-nav');
const exchangeNav = document.getElementById('exchange-nav');
const mainNav = document.createElement('div');
mainNav.className = 'swipe-navigation left-nav';
mainNav.id = 'main-nav';
mainNav.innerHTML = `
    <div class="nav-arrow">
        <i class="fas fa-home"></i>
    </div>
    <div class="nav-label">Главная</div>
`;
// Добавляем в DOM
document.body.appendChild(mainNav);
const referralLink = document.getElementById('referral-link');
const shareButton = document.getElementById('share-button');
const discountsContainer = document.getElementById('discounts-container');
const referralsContainer = document.getElementById('referrals-container');

// Сохраняем состояние интерфейса
let interfaceState = {
    exchangeButtonVisible: true
};

// Функция для переключения между страницами
function switchToPage(pageName) {
    // Сохраняем предыдущую страницу для анимации
    const prevPage = currentPage;
    
    // Скрываем все страницы
    step1.classList.remove('active');
    step2.classList.remove('active');
    referralPage.classList.remove('active');
    
    // Показываем выбранную страницу
    if (pageName === 'step-1') {
        step1.classList.add('active');
        currentPage = 'step-1';
        
        // На главной странице показываем только кнопку рефералов слева и биржи справа
        referralNav.style.display = 'flex';
        mainNav.style.display = 'none'; // Скрываем кнопку главной на главной странице
        exchangeNav.style.display = 'flex';
    } else if (pageName === 'step-2') {
        step2.classList.add('active');
        currentPage = 'step-2';
        
        // На странице шага 2 показываем кнопку рефералов слева и биржи справа
        referralNav.style.display = 'flex';
        mainNav.style.display = 'none'; // Скрываем кнопку главной на странице шага 2
        exchangeNav.style.display = 'flex';
    } else if (pageName === 'referral') {
        referralPage.classList.add('active');
        currentPage = 'referral';
        
        // На странице рефералов показываем кнопку главной слева и биржи справа
        referralNav.style.display = 'none';
        mainNav.style.display = 'flex';
        mainNav.className = 'swipe-navigation left-nav';
        exchangeNav.style.display = 'flex';
        
        // Загружаем данные реферальной системы
        loadReferralData();
    }
    
    // Добавляем анимацию перехода между страницами
    if (prevPage && prevPage !== pageName) {
        // Скрываем все страницы перед анимацией
        document.querySelectorAll('.page').forEach(page => {
            if (!page.classList.contains('active')) {
                page.style.display = 'none';
            }
        });
        addPageTransitionAnimation(prevPage, pageName);
    }
}

// Функция для добавления анимации перехода между страницами
function addPageTransitionAnimation(fromPage, toPage) {
    // Определяем направление анимации
    let fromAnimation, toAnimation;
    
    if (
        (fromPage === 'step-1' && toPage === 'step-2') || 
        (fromPage === 'step-1' && toPage === 'referral') ||
        (fromPage === 'referral' && toPage === 'step-2')
    ) {
        // Переход вперед (влево)
        fromAnimation = 'animate__fadeOutLeft';
        toAnimation = 'animate__fadeInRight';
    } else {
        // Переход назад (вправо)
        fromAnimation = 'animate__fadeOutRight';
        toAnimation = 'animate__fadeInLeft';
    }
    
    // Получаем элементы страниц
    const fromElement = getPageElement(fromPage);
    const toElement = getPageElement(toPage);
    
    if (fromElement && toElement) {
        // Добавляем классы анимации
        fromElement.classList.add('animate__animated', fromAnimation);
        
        // Убедимся, что целевая страница видна для анимации
        toElement.style.display = 'block';
        toElement.style.opacity = '0';
        
        // Запускаем анимацию с небольшой задержкой
        setTimeout(() => {
            fromElement.style.display = 'none';
            toElement.classList.add('animate__animated', toAnimation);
            toElement.style.opacity = '1';
            
            // Удаляем классы анимации после завершения
            setTimeout(() => {
                fromElement.classList.remove('animate__animated', fromAnimation);
                toElement.classList.remove('animate__animated', toAnimation);
            }, 500);
        }, 300);
    }
}

// Функция для получения элемента страницы по имени
function getPageElement(pageName) {
    switch (pageName) {
        case 'step-1': return step1;
        case 'step-2': return step2;
        case 'referral': return referralPage;
        default: return null;
    }
}

// Обработчики для навигационных стрелок
referralNav.addEventListener('click', () => {
    // Переход на страницу рефералов с главной или шага 2
    if (currentPage === 'step-1' || currentPage === 'step-2') {
        switchToPage('referral');
    }
});

exchangeNav.addEventListener('click', () => {
    // Переход на страницу биржи с любой страницы
    window.location.href = 'exchange.html';
});

mainNav.addEventListener('click', () => {
    // Переход на главную страницу с страницы рефералов
    if (currentPage === 'referral') {
        switchToPage('step-1');
    }
});

// Функция для загрузки данных реферальной системы
async function loadReferralData() {
    try {
        // Показываем индикатор загрузки
        loader.classList.add('active');
        
        // Всегда пытаемся получить свежие данные с сервера
        try {
            // Получаем initData из Telegram WebApp
            const initData = window.Telegram.WebApp.initData;
            
            // Создаем заголовки для запроса
            const headers = {
                'Content-Type': 'application/json',
                'X-Telegram-Web-App-Init-Data': initData
            };
            
            // Отправляем запрос с заголовками
            const response = await fetch('/api/referral-data', { headers });
            const data = await response.json();
            
            if (data.success) {
                referralData = data.data;
                
                // Сохраняем данные в localStorage с временной меткой
                localStorage.setItem('referralData', JSON.stringify({
                    data: referralData,
                    timestamp: Date.now()
                }));
                
                console.log('Данные реферальной системы успешно загружены:', referralData);
            } else {
                console.error('Ошибка при загрузке данных реферальной системы:', data.error);
                
                // Проверяем, есть ли данные в localStorage для использования в качестве резервных
                const savedReferralData = localStorage.getItem('referralData');
                
                if (savedReferralData) {
                    try {
                        const parsedData = JSON.parse(savedReferralData);
                        referralData = parsedData.data;
                        console.log('Используем кэшированные данные из localStorage');
                    } catch (e) {
                        console.error('Ошибка при парсинге сохраненных данных:', e);
                        generateTemporaryReferralData();
                    }
                } else {
                    // Генерируем временные данные, если не удалось получить с сервера
                    generateTemporaryReferralData();
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных реферальной системы:', error);
            
            // Проверяем, есть ли данные в localStorage для использования в качестве резервных
            const savedReferralData = localStorage.getItem('referralData');
            
            if (savedReferralData) {
                try {
                    const parsedData = JSON.parse(savedReferralData);
                    referralData = parsedData.data;
                    console.log('Используем кэшированные данные из localStorage после ошибки сети');
                } catch (e) {
                    console.error('Ошибка при парсинге сохраненных данных:', e);
                    generateTemporaryReferralData();
                }
            } else {
                // Генерируем временные данные при ошибке сети
                generateTemporaryReferralData();
            }
        }
        
        // Обновляем реферальную ссылку
        referralLink.value = referralData.referralLink;
        
        // Обновляем список скидок
        updateDiscountsList();
        
        // Обновляем список рефералов
        updateReferralsList();
    } catch (error) {
        console.error('Непредвиденная ошибка при загрузке данных:', error);
        // Генерируем временные данные при любой непредвиденной ошибке
        generateTemporaryReferralData();
        
        // Обновляем интерфейс с временными данными
        referralLink.value = referralData.referralLink;
        updateDiscountsList();
        updateReferralsList();
    } finally {
        // Скрываем индикатор загрузки
        loader.classList.remove('active');
    }
}

// Функция для генерации временных данных реферальной системы
function generateTemporaryReferralData() {
    // Получаем данные текущего пользователя
    const currentUser = window.Telegram.WebApp.initDataUnsafe.user;
    const userId = currentUser && currentUser.id ? currentUser.id.toString() : 'user';
    
    // Генерируем уникальный код для реферальной ссылки
    const uniqueCode = Math.random().toString(36).substring(2, 10);
    
    // Используем правильный username бота
    const botUsername = 'pasha321bot'; // Используем корректный username бота
    // Создаем временные данные
    referralData = {
        referralLink: `https://t.me/${botUsername}?start=ref_${userId}_${uniqueCode}`,
        referrals: [],
        discounts: []
    };
    
    // Сохраняем временные данные в localStorage
    localStorage.setItem('referralData', JSON.stringify({
        data: referralData,
        timestamp: Date.now()
    }));
    
    // Обновляем реферальную ссылку в интерфейсе
    if (referralLink) {
        referralLink.value = referralData.referralLink;
    }
    
    // Показываем уведомление пользователю
    setTimeout(() => {
        tgApp.showPopup({
            title: 'Временная ссылка',
            message: 'Не удалось загрузить данные с сервера. Создана временная реферальная ссылка.',
            buttons: [{type: 'ok'}]
        });
    }, 500);
}

// Функция для обновления списка скидок
function updateDiscountsList() {
    // Очищаем контейнер скидок
    discountsContainer.innerHTML = '';
    
    // Если скидок нет, показываем сообщение
    if (!referralData.discounts || referralData.discounts.length === 0) {
        discountsContainer.innerHTML = '<div class="no-discounts">У вас пока нет доступных скидок</div>';
        return;
    }
    
    // Добавляем скидки в контейнер
    referralData.discounts.forEach(discount => {
        const discountDate = new Date(discount.createdAt);
        const formattedDate = discountDate.toLocaleDateString('ru-RU');
        
        const discountItem = document.createElement('div');
        discountItem.className = 'discount-item';
        discountItem.innerHTML = `
            <div class="discount-info">
                <div class="discount-percent">${discount.percent}% скидка</div>
                <div class="discount-reason">${discount.reason}</div>
                <div class="discount-date">Получена: ${formattedDate}</div>
            </div>
        `;
        
        discountsContainer.appendChild(discountItem);
    });
}

// Функция для обновления списка рефералов
function updateReferralsList() {
    // Очищаем контейнер рефералов
    referralsContainer.innerHTML = '';
    
    // Если рефералов нет, показываем сообщение
    if (!referralData.referrals || referralData.referrals.length === 0) {
        referralsContainer.innerHTML = '<div class="no-referrals">У вас пока нет рефералов</div>';
        return;
    }
    
    // Добавляем рефералов в контейнер
    referralData.referrals.forEach(referral => {
        const joinDate = new Date(referral.joinDate);
        const formattedDate = joinDate.toLocaleDateString('ru-RU');
        
        const referralItem = document.createElement('div');
        referralItem.className = 'referral-item';
        referralItem.innerHTML = `
            <div class="referral-info">
                <div class="referral-username">@${referral.username}</div>
                <div class="discount-date">Присоединился: ${formattedDate}</div>
            </div>
            <div class="referral-stars"><i class="fas fa-star"></i> ${referral.totalStarsPurchased}</div>
        `;
        
        referralsContainer.appendChild(referralItem);
    });
}

// Обработчик для кнопки "Поделиться"
shareButton.addEventListener('click', () => {
    // Проверяем, что реферальная ссылка существует
    if (!referralLink.value) {
        // Если ссылки нет, генерируем временную
        generateTemporaryReferralData();
    }
    
    // Копируем реферальную ссылку в буфер обмена
    referralLink.select();
    document.execCommand('copy');
    
    // Показываем уведомление об успешном копировании
    tgApp.showPopup({
        title: 'Ссылка скопирована',
        message: 'Реферальная ссылка скопирована в буфер обмена. Теперь вы можете поделиться ею с друзьями.',
        buttons: [{type: 'ok'}]
    });
    
    // Если доступен нативный метод Telegram для шаринга, используем его
    if (tgApp.showSharePopup) {
        tgApp.showSharePopup({
            text: `Присоединяйся к Stars Store и получай звезды для своего Telegram аккаунта! ${referralLink.value}`
        });
    }
});

// Цена за одну звезду (в рублях)
const PRICE_PER_STAR = 1.5;

// Максимальное количество звезд
const MAX_STARS = 1000000;

// Текущий выбранный пакет
let selectedPackage = null;
let selectedStars = 0;
let selectedPrice = 0;

// Данные реферальной системы
let referralData = {
    referralLink: '',
    referrals: [],
    discounts: []
};

// Пытаемся загрузить данные из localStorage при инициализации
try {
    const savedReferralData = localStorage.getItem('referralData');
    if (savedReferralData) {
        const parsedData = JSON.parse(savedReferralData);
        if (parsedData && parsedData.data) {
            referralData = parsedData.data;
        }
    }
} catch (e) {
    console.error('Ошибка при загрузке сохраненных данных реферальной системы:', e);
}

// Форматирование цены
function formatPrice(price) {
    return price.toFixed(2).replace(/\.00$/, '') + ' ₽';
}

// Обновление цены для пользовательского пакета
function updateCustomPrice() {
    const stars = parseInt(starsInput.value) || 50;
    const totalPrice = stars * PRICE_PER_STAR;
    
    // Форматируем цену и обновляем элемент
    const formattedPrice = formatPrice(totalPrice).replace(' ₽', '');
    if (priceElement) {
        priceElement.textContent = formattedPrice;
        
        // Анимация изменения цены
        priceElement.classList.add('price-updated');
        setTimeout(() => {
            priceElement.classList.remove('price-updated');
        }, 300);
    }
    
    return totalPrice; // Возвращаем вычисленную цену для использования в других функциях
}


// Обработчик изменения значения в поле ввода
starsInput.addEventListener('input', () => {
    let value = parseInt(starsInput.value) || 50;
    
    // Ограничиваем значение
    if (value < 50) value = 50;
    if (value > MAX_STARS) value = MAX_STARS;
    
    // Обновляем значение в поле ввода
    starsInput.value = value;
    
    // Обновляем цену
    updateCustomPrice();
});

// Обновляем цену при загрузке страницы
starsInput.addEventListener('change', updateCustomPrice);

// Предотвращаем ввод нечисловых символов
starsInput.addEventListener('keypress', (e) => {
    if (!/^\d$/.test(e.key)) {
        e.preventDefault();
    }
});

// Обработчик для кнопки "Продолжить" к шагу 2
toStep2Btn.addEventListener('click', () => {
    // Получаем данные о пользовательском пакете
    selectedStars = parseInt(starsInput.value) || 50;
    selectedPrice = updateCustomPrice(); // Используем функцию для расчета цены
    
    // Обновляем данные заказа
    if (summaryStars) summaryStars.textContent = selectedStars + ' ⭐';
    if (summaryPrice) summaryPrice.textContent = formatPrice(selectedPrice);
    
    // Используем единую функцию для переключения страниц
    switchToPage('step-2');
    
    // Фокус на поле ввода имени пользователя
    setTimeout(() => {
        if (usernameInput) usernameInput.focus();
    }, 600);
    
    // Логируем для отладки
    console.log('Переход к шагу 2. Выбрано звёзд:', selectedStars, 'Цена:', selectedPrice);
});

// Обработчик для кнопки "Назад" к шагу 1
backToStep1Btn.addEventListener('click', () => {
// Переключаем шаги с анимацией перехода
step2.classList.remove('active');
step2.classList.add('animate__animated', 'animate__fadeOutRight');
    
    setTimeout(() => {
        step2.style.display = 'none';
        step1.style.display = 'block';
        step1.classList.remove('animate__fadeOutLeft');
        step1.classList.add('active', 'animate__animated', 'animate__fadeInLeft');
    }, 300);
});

// ===== НОВАЯ РЕАЛИЗАЦИЯ ВЫПАДАЮЩЕГО СПИСКА КОНТАКТОВ =====

// Инициализация выпадающего списка контактов
function initContactsDropdown() {
    // Устанавливаем начальное значение поля ввода - текущий пользователь
    const currentUser = window.Telegram.WebApp.initDataUnsafe.user;
    if (currentUser && currentUser.username) {
        usernameInput.value = currentUser.username;
        
        // Автоматически показываем выпадающий список с текущим пользователем при загрузке
        setTimeout(() => {
            showContactsDropdown();
        }, 500);
    }
    
    // Добавляем обработчик фокуса для поля ввода имени пользователя
    usernameInput.addEventListener('focus', showContactsDropdown);
    
    // Обработчик ввода для поиска
    usernameInput.addEventListener('input', debounce(filterContacts, 300));
    
    // Обработчик клика вне выпадающего списка
    document.addEventListener('click', handleOutsideClick);
}

// Функция для задержки выполнения (debounce)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Функция для получения данных текущего пользователя из Telegram API
async function fetchCurrentUser() {
    try {
        // Получаем данные текущего пользователя
        const currentUser = window.Telegram.WebApp.initDataUnsafe.user;
        
        if (!currentUser) {
            return {
                first_name: 'Не удалось получить данные пользователя',
                is_error_message: true
            };
        }
        
        // Возвращаем информацию о текущем пользователе
        return {
            id: currentUser.id,
            first_name: currentUser.first_name || (currentUser.username ? currentUser.username : 'Пользователь'),
            last_name: currentUser.last_name,
            username: currentUser.username,
            photo_url: currentUser.photo_url,
            is_current_user: true,
            is_error_message: false
        };
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return {
            first_name: 'Ошибка при получении данных пользователя',
            is_error_message: true
        };
    }
}

// Функция для поиска пользователя по username
async function searchUserByUsername(username) {
    try {
        // Проверяем, что username не пустой и соответствует формату Telegram
        if (!username || username.length < 5 || username.length > 32) {
            return {
                is_error_message: true,
                first_name: 'Неверный формат имени пользователя',
                error_code: 'INVALID_USERNAME'
            };
        }
        
        // Проверяем, что username содержит только допустимые символы
        const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
        if (!usernameRegex.test(username)) {
            return {
                is_error_message: true,
                first_name: 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
                error_code: 'INVALID_USERNAME'
            };
        }
        
        // Показываем индикатор загрузки в выпадающем списке
        contactsDropdown.innerHTML = '<div class="loading-contacts">Поиск пользователя...</div>';
        
        // Отправляем запрос к API для поиска пользователя
        const response = await fetch(`/api/search-user?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        // Если пользователь не найден
        if (!data.success) {
            if (data.error_code === 'INVALID_USERNAME') {
                return {
                    is_error_message: true,
                    first_name: 'Неверный формат имени пользователя',
                    error_code: 'INVALID_USERNAME'
                };
            } else {
                return {
                    is_error_message: true,
                    first_name: 'Пользователь не найден',
                    error_code: data.error_code || 'USER_NOT_FOUND'
                };
            }
        }
        
        // Если пользователь найден, возвращаем его данные
        return {
            id: data.user.id,
            username: data.user.username,
            first_name: data.user.first_name || (data.user.username ? data.user.username : 'Пользователь'),
            last_name: data.user.last_name,
            photo_url: data.user.photo_url,
            is_private: Boolean(data.user.is_private) // Явно приводим к булевому значению
        };
    } catch (error) {
        console.error('Ошибка при поиске пользователя:', error);
        return {
            is_error_message: true,
            first_name: 'Ошибка при поиске пользователя',
            error_code: 'SEARCH_ERROR'
        };
    }
}

// Отображение выпадающего списка контактов
async function showContactsDropdown() {
    // Показываем индикатор загрузки
    contactsDropdown.innerHTML = '<div class="loading-contacts">Загрузка данных</div>';
    contactsDropdown.classList.add('active');
    
    // Получаем данные текущего пользователя
    const currentUser = await fetchCurrentUser();
    
    // Сохраняем текущего пользователя в кэш
    saveContactToCache(currentUser);
    
    // Отображаем текущего пользователя
    renderContacts([currentUser]);
}

// Отрисовка контактов в выпадающем списке
function renderContacts(contacts) {
    // Очищаем выпадающий список
    contactsDropdown.innerHTML = '';
    
    // Если контактов нет, показываем сообщение
    if (!contacts || contacts.length === 0) {
        contactsDropdown.innerHTML = '<div class="contact-item error-message">Нет доступных данных</div>';
        return;
    }
    
    // Добавляем контакты в выпадающий список
    contacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        // Добавляем специальные классы
        if (contact.is_current_user) {
            contactItem.classList.add('current-user');
        }
        if (contact.is_error_message) {
            contactItem.classList.add('error-message');
        }
        if (contact.is_private) {
            contactItem.classList.add('private-account');
        }
        
        // Формируем имя контакта
        let contactName;
        if (contact.first_name) {
            contactName = contact.first_name;
            if (contact.last_name) contactName += ' ' + contact.last_name;
        } else if (contact.username) {
            contactName = '@' + contact.username;
        } else {
            contactName = 'Пользователь';
        }
        
        if (contact.is_current_user) contactName += ' (Вы)';
        
        // Отдельная метка для приватного аккаунта
        let privateLabel = '';
        if (contact.is_private) {
            privateLabel = '<span class="private-label">Приватный аккаунт</span>';
        }
        
        // Добавляем имя пользователя, если оно есть
        const usernameText = contact.username ? `@${contact.username}` : '';
        
        // Создаем HTML для элемента контакта
        if (contact.is_error_message) {
            // Для сообщений об ошибках используем специальный формат
            contactItem.innerHTML = `
                <div class="contact-info error-info">
                    <div class="contact-name">${contactName}</div>
                </div>
            `;
        } else {
            // Для обычных контактов используем стандартный формат с аватаркой
            contactItem.innerHTML = `
                <div class="contact-avatar">
                    ${contact.photo_url ? `<img src="${contact.photo_url}" alt="${contactName}">` : '<div class="default-avatar"></div>'}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contactName} ${privateLabel}</div>
                    <div class="contact-username">${usernameText}</div>
                </div>
            `;
            
            // Добавляем обработчик клика для всех контактов (включая приватные)
            contactItem.addEventListener('click', () => {
                // Устанавливаем имя пользователя в поле ввода
                if (contact.username) {
                    usernameInput.value = contact.username;
                }
                
                // Скрываем выпадающий список
                hideContactsDropdown();
            });
        }
        
        // Добавляем элемент в выпадающий список
        contactsDropdown.appendChild(contactItem);
    });
    
    // Добавляем подсказку о вводе username
    const usernameHint = document.createElement('div');
    usernameHint.className = 'username-hint';
    usernameHint.innerHTML = 'Введите username пользователя для поиска (без символа @)';
    contactsDropdown.appendChild(usernameHint);
}

// Фильтрация контактов при вводе
async function filterContacts() {
    const searchText = usernameInput.value.trim().toLowerCase();
    
    // Если поле ввода пустое, показываем только текущего пользователя
    if (!searchText) {
        const currentUser = await fetchCurrentUser();
        renderContacts([currentUser]);
        return;
    }
    
    // Проверяем, является ли текущий пользователь
    const currentUser = await fetchCurrentUser();
    if (currentUser.username && currentUser.username.toLowerCase() === searchText) {
        renderContacts([currentUser]);
        return;
    }
    
    // Показываем индикатор загрузки
    contactsDropdown.innerHTML = '<div class="loading-contacts">Поиск пользователя...</div>';
    
    // Проверяем, есть ли пользователь в кэше
    const cachedUser = getUserFromCache(searchText);
    
    if (cachedUser) {
        // Если пользователь найден в кэше, отображаем его
        renderContacts([cachedUser]);
    } else {
        try {
            // Если пользователя нет в кэше, ищем его через API
            const user = await searchUserByUsername(searchText);
            
            // Если пользователь найден, сохраняем его в кэш
            if (!user.is_error_message) {
                saveContactToCache(user);
            }
            
            // Отображаем результат поиска
            renderContacts([user]);
        } catch (error) {
            console.error('Ошибка при поиске пользователя:', error);
            renderContacts([{
                is_error_message: true,
                first_name: 'Ошибка при поиске пользователя'
            }]);
        }
    }
}

// Обработка клика вне выпадающего списка
function handleOutsideClick(event) {
    if (!contactsDropdown.contains(event.target) && event.target !== usernameInput) {
        hideContactsDropdown();
    }
}

// Скрытие выпадающего списка
function hideContactsDropdown() {
    contactsDropdown.classList.remove('active');
}

// Сохранение контакта в кэш
function saveContactToCache(contact) {
    if (!contact || !contact.username) return;
    
    try {
        // Получаем текущие контакты из кэша
        let contacts = {};
        const contactsCache = localStorage.getItem('contactsCache');
        
        if (contactsCache) {
            contacts = JSON.parse(contactsCache);
        }
        
        // Добавляем или обновляем контакт в кэше
        contacts[contact.username.toLowerCase()] = {
            ...contact,
            timestamp: Date.now()
        };
        
        // Сохраняем обновленный кэш
        localStorage.setItem('contactsCache', JSON.stringify(contacts));
    } catch (error) {
        console.error('Ошибка при сохранении контакта в кэш:', error);
    }
}

// Получение пользователя из кэша по username
function getUserFromCache(username) {
    if (!username) return null;
    
    try {
        const contactsCache = localStorage.getItem('contactsCache');
        
        if (!contactsCache) return null;
        
        const contacts = JSON.parse(contactsCache);
        const cachedContact = contacts[username.toLowerCase()];
        
        if (!cachedContact) return null;
        
        const currentTime = Date.now();
        const cacheAge = currentTime - cachedContact.timestamp;
        
        // Если кэш старше 1 часа, считаем его устаревшим
        if (cacheAge > 3600000) {
            return null;
        }
        
        return cachedContact;
    } catch (error) {
        console.error('Ошибка при получении пользователя из кэша:', error);
        return null;
    }
}

// Инициализация выпадающего списка контактов
initContactsDropdown();

// Обработчик для кнопки "Купить"
buyButton.addEventListener('click', () => {
    let username = usernameInput.value.trim();
    
    // Проверка ввода
    if (!username) {
        // Визуальная обратная связь
        usernameInput.classList.add('error');
        usernameInput.focus();
        
        setTimeout(() => {
            usernameInput.classList.remove('error');
        }, 1000);
        
        // Сообщение об ошибке
        tgApp.showPopup({
            title: 'Ошибка',
            message: 'Пожалуйста, введите имя пользователя',
            buttons: [{type: 'ok'}]
        });
        
        return;
    }
    
    // Удаляем символ @ в начале, если он есть
    if (username.startsWith('@')) {
        username = username.substring(1);
    }
    
    // Проверяем, что имя пользователя соответствует требованиям Telegram
    // (5-32 символа, только буквы, цифры и подчеркивания)
    const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
    if (!usernameRegex.test(username)) {
        tgApp.showPopup({
            title: 'Ошибка',
            message: 'Имя пользователя должно содержать от 5 до 32 символов и может включать только буквы, цифры и подчеркивания',
            buttons: [{type: 'ok'}]
        });
        return;
    }
    
    // Показываем индикатор загрузки
    loader.style.display = 'flex';
    
    // Отправляем данные заказа в бот
    const orderData = {
        username: username,
        stars: selectedStars,
        price: selectedPrice
    };
    
    // Отправляем данные в бот
    tgApp.sendData(JSON.stringify(orderData));
    
    // Закрываем приложение
    tgApp.close();
});

// Инициализация при загрузке страницы
updateCustomPrice();
