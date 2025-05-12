// Инициализация Telegram Web App
const tgApp = window.Telegram.WebApp;

// Адаптация к теме Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tgApp.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tgApp.textColor);
document.documentElement.style.setProperty('--tg-theme-hint-color', tgApp.textColor);
document.documentElement.style.setProperty('--tg-theme-link-color', tgApp.linkColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tgApp.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tgApp.buttonTextColor);

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

// Получаем элементы DOM
const usernameInput = document.getElementById('username');
const starsInput = document.getElementById('stars');
const decreaseBtn = document.getElementById('decrease');
const increaseBtn = document.getElementById('increase');
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

// Цена за одну звезду (в рублях)
const PRICE_PER_STAR = 1.5;

// Максимальное количество звезд
const MAX_STARS = 1000000;

// Текущий выбранный пакет
let selectedPackage = null;
let selectedStars = 0;
let selectedPrice = 0;

// Форматирование цены
function formatPrice(price) {
    return price.toFixed(2).replace(/\.00$/, '') + ' ₽';
}

// Обновление цены для пользовательского пакета
function updateCustomPrice() {
    const stars = parseInt(starsInput.value) || 50;
    const totalPrice = stars * PRICE_PER_STAR;
    priceElement.textContent = formatPrice(totalPrice).replace(' ₽', '');
    
    // Обновляем состояние кнопок
    decreaseBtn.disabled = stars <= 50;
    increaseBtn.disabled = stars >= MAX_STARS;
    
    // Визуальная обратная связь
    if (stars <= 50) {
        decreaseBtn.style.opacity = '0.5';
    } else {
        decreaseBtn.style.opacity = '1';
    }
    
    if (stars >= MAX_STARS) {
        increaseBtn.style.opacity = '0.5';
    } else {
        increaseBtn.style.opacity = '1';
    }
    
    // Анимация изменения цены
    priceElement.classList.add('price-updated');
    setTimeout(() => {
        priceElement.classList.remove('price-updated');
    }, 300);
}

// Обработчики для кнопок увеличения/уменьшения количества звезд
decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(starsInput.value) || 50;
    if (currentValue > 50) {
        starsInput.value = currentValue - 1;
        updateCustomPrice();
    }
});

increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(starsInput.value) || 50;
    if (currentValue < MAX_STARS) {
        starsInput.value = currentValue + 1;
        updateCustomPrice();
    }
});

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
    selectedPrice = selectedStars * PRICE_PER_STAR;
    
    // Обновляем данные заказа
    summaryStars.textContent = selectedStars + ' ⭐';
    summaryPrice.textContent = formatPrice(selectedPrice);
    
    // Переключаем шаги
    step1.classList.remove('active');
    step1.classList.add('animate__animated', 'animate__fadeOutLeft');
    
    // Убедимся, что второй шаг изначально виден для анимации
    step2.style.display = 'block';
    step2.style.opacity = '0';
    
    setTimeout(() => {
        step1.style.display = 'none';
        step2.classList.add('active', 'animate__animated', 'animate__fadeInRight');
        
        // Фокус на поле ввода имени пользователя
        setTimeout(() => {
            usernameInput.focus();
        }, 300);
    }, 300);
});

// Обработчик для кнопки "Назад" к шагу 1
backToStep1Btn.addEventListener('click', () => {
    // Переключаем шаги
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
            first_name: currentUser.first_name,
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
                first_name: 'Пользователь не найден',
                error_code: 'USER_NOT_FOUND'
            };
        }
        
        // Показываем индикатор загрузки в выпадающем списке
        contactsDropdown.innerHTML = '<div class="loading-contacts">Поиск пользователя...</div>';
        
        // Отправляем запрос к API для поиска пользователя
        const response = await fetch(`/api/search-user?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        // Если пользователь не найден
        if (!data.success) {
            return {
                is_error_message: true,
                first_name: 'Пользователь не найден',
                error_code: data.error_code || 'USER_NOT_FOUND'
            };
        }
        
        // Если пользователь найден, возвращаем его данные
        return {
            id: data.user.id,
            username: data.user.username,
            first_name: data.user.first_name || 'Пользователь',
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
        let contactName = contact.first_name || 'Пользователь';
        if (contact.last_name) contactName += ' ' + contact.last_name;
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
    usernameHint.innerHTML = 'Введите username пользователя для поиска';
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
