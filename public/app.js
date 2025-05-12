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
    }
    
    // Добавляем обработчик фокуса для поля ввода имени пользователя
    usernameInput.addEventListener('focus', showContactsDropdown);
    
    // Обработчик ввода для поиска
    usernameInput.addEventListener('input', filterContacts);
    
    // Обработчик клика вне выпадающего списка
    document.addEventListener('click', handleOutsideClick);
}

// Функция для получения данных текущего пользователя из Telegram API
async function fetchContacts() {
    try {
        // Получаем данные текущего пользователя
        const currentUser = window.Telegram.WebApp.initDataUnsafe.user;
        
        if (!currentUser) {
            return [{
                first_name: 'Не удалось получить данные пользователя',
                is_error_message: true
            }];
        }
        
        // Возвращаем информацию о текущем пользователе
        return [{
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            username: currentUser.username,
            photo_url: currentUser.photo_url,
            is_current_user: true,
            is_error_message: false
        }];
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return [{
            first_name: 'Ошибка при получении данных пользователя',
            is_error_message: true
        }];
    }
}

// Отображение выпадающего списка контактов
async function showContactsDropdown() {
    // Показываем индикатор загрузки
    contactsDropdown.innerHTML = '<div class="loading-contacts">Загрузка данных</div>';
    contactsDropdown.classList.add('active');
    
    // Пробуем получить контакты из кэша
    let contacts = getContactsFromCache();
    
    // Если кэш пуст или устарел, запрашиваем контакты заново
    if (!contacts || contacts.length <= 1) {
        contacts = await fetchContacts();
    }
    
    // Отображаем контакты
    renderContacts(contacts);
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
    
    // Получаем текущее значение поля ввода
    const inputValue = usernameInput.value.trim().toLowerCase();
    const isSearching = inputValue && !inputValue.startsWith('@') && inputValue !== contacts[0].username;
    
    // Если пользователь ввел текст для поиска, проверяем его как username
    if (isSearching) {
        // Создаем элемент для отображения результата поиска
        const searchItem = document.createElement('div');
        searchItem.className = 'contact-item';
        
        // Создаем HTML для результата поиска
        let searchHTML = '<div class="contact-avatar"><div class="default-avatar"></div></div>';
        searchHTML += '<div class="contact-info">';
        searchHTML += `<div class="contact-name">Пользователь с username @${inputValue}</div>`;
        searchHTML += `<div class="contact-username">@${inputValue}</div>`;
        searchHTML += '</div>';
        
        searchItem.innerHTML = searchHTML;
        
        // Добавляем обработчик клика для выбора результата поиска
        searchItem.addEventListener('click', () => {
            // Устанавливаем значение в поле ввода
            usernameInput.value = inputValue;
            // Скрываем выпадающий список
            contactsDropdown.classList.remove('active');
            // Убираем фокус с поля ввода
            usernameInput.blur();
        });
        
        contactsDropdown.appendChild(searchItem);
    }
    
    // Проверяем, есть ли в списке только сообщения об ошибках
    const hasOnlyErrorMessages = contacts.every(contact => contact.is_error_message);
    const hasErrorMessages = contacts.some(contact => contact.is_error_message);
    
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
        
        // Формируем имя контакта
        let contactName = contact.first_name;
        if (contact.last_name) contactName += ' ' + contact.last_name;
        if (contact.is_current_user) contactName += ' (Вы)';
        
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
                    <div class="contact-name">${contactName}</div>
                    <div class="contact-username">${usernameText}</div>
                </div>
            `;
            
            // Добавляем обработчик клика только для обычных контактов
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
    
    // Если есть только сообщения об ошибках, не добавляем кнопку выбора контакта
    if (hasOnlyErrorMessages) {
        return;
    }

    
    // Добавляем подсказку о вводе username
    const usernameHint = document.createElement('div');
    usernameHint.className = 'username-hint';
    usernameHint.innerHTML = 'Введите username пользователя для поиска';
    contactsDropdown.appendChild(usernameHint);
}

// Фильтрация контактов при вводе
function filterContacts() {
    const searchText = usernameInput.value.toLowerCase();
    const contacts = getContactsFromCache();
    
    if (!contacts || contacts.length === 0) return;
    
    // Находим сообщения об ошибках
    const errorMessages = contacts.filter(contact => contact.is_error_message);
    
    // Фильтруем только обычные контакты (не сообщения об ошибках)
    const filteredContacts = contacts.filter(contact => {
        // Пропускаем сообщения об ошибках при фильтрации
        if (contact.is_error_message) return false;
        
        const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
        const username = (contact.username || '').toLowerCase();
        
        return fullName.includes(searchText) || username.includes(searchText);
    });
    
    // Добавляем сообщения об ошибках к отфильтрованным контактам
    const resultContacts = [...errorMessages, ...filteredContacts];
    
    // Отображаем отфильтрованные контакты
    renderContacts(resultContacts);
    
    // Если нет результатов, показываем сообщение
    if (filteredContacts.length === 0 && searchText && errorMessages.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'contact-item no-results';
        noResults.textContent = 'Нет результатов';
        contactsDropdown.appendChild(noResults);
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

// Сохранение контакта
function saveContact(contact) {
    if (!contact || !contact.username) return;
    
    try {
        // Получаем текущие контакты из кэша
        let contacts = getContactsFromCache() || [];
        
        // Проверяем, есть ли уже такой контакт в списке
        const contactExists = contacts.some(c => 
            c.username === contact.username && !c.is_current_user);
        
        // Если контакта нет, добавляем его
        if (!contactExists) {
            contacts.push(contact);
            // Сохраняем обновленный список контактов
            saveContactsToCache(contacts);
        }
    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
    }
}

// Работа с кэшем контактов
function saveContactsToCache(contacts) {
    try {
        localStorage.setItem('contactsCache', JSON.stringify(contacts));
        localStorage.setItem('contactsCacheTimestamp', Date.now());
    } catch (error) {
        console.error('Ошибка при сохранении контактов в кэш:', error);
    }
}

function getContactsFromCache() {
    try {
        const cacheTimestamp = localStorage.getItem('contactsCacheTimestamp');
        const currentTime = Date.now();
        const cacheAge = currentTime - cacheTimestamp;
        
        // Если кэш старше 1 часа, считаем его устаревшим
        if (!cacheTimestamp || cacheAge > 3600000) {
            return null;
        }
        
        const contactsCache = localStorage.getItem('contactsCache');
        if (contactsCache) {
            return JSON.parse(contactsCache);
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка при получении контактов из кэша:', error);
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
