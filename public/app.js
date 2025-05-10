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

// Так как готовые пакеты убраны, этот обработчик больше не нужен


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

// Обработчик для кнопки "Купить"
buyButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    
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
    
    // Показываем лоадер
    loader.classList.add('active');
    
    // Анимация кнопки
    buyButton.classList.add('clicked');
    
    // Подготовка данных для отправки в бота
    const data = {
        username: username,
        stars: selectedStars,
        price: selectedPrice
    };
    
    // Небольшая задержка для анимации
    setTimeout(() => {
        // Отправка данных в бота
        tgApp.sendData(JSON.stringify(data));
        
        // Закрытие Mini App
        tgApp.close();
    }, 1500);
});

// Так как готовые пакеты убраны, этот обработчик больше не нужен

// Добавляем анимации при прокрутке
function animateOnScroll() {
    const elements = document.querySelectorAll('.custom-package');
    
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate__animated', 'animate__fadeInUp');
            setTimeout(() => {
                element.classList.remove('animate__animated', 'animate__fadeInUp');
            }, 1000);
        }, index * 150);
    });
}

// Анимация звезд в футере
function animateStars() {
    const stars = document.querySelectorAll('.stars-decoration i');
    
    stars.forEach((star, index) => {
        // Случайное начальное положение
        star.style.transform = `translateY(${Math.random() * 10}px)`;
        
        // Задержка для каждой звезды
        setTimeout(() => {
            star.style.transition = 'transform 3s ease-in-out';
        }, index * 200);
    });
}

// Навигация свайпом между страницами
const leftNav = document.querySelector('.left-nav');
const rightNav = document.querySelector('.right-nav');
const appContainer = document.querySelector('.app-container');

// Текущая страница (0 - магазин, -1 - рефералка, 1 - биржа)
let currentPage = 0;

// Обработчики для навигационных стрелок
leftNav.addEventListener('click', () => {
    navigateToPage(-1); // Переход на страницу "Рефералка"
});

rightNav.addEventListener('click', () => {
    navigateToPage(1); // Переход на страницу "Биржа"
});

// Функция для навигации между страницами
function navigateToPage(pageIndex) {
    // Если пытаемся перейти на текущую страницу, ничего не делаем
    if (pageIndex === currentPage) return;
    
    // Анимация перехода
    if (pageIndex < currentPage) {
        // Переход влево
        appContainer.classList.add('animate__animated', 'animate__fadeOutRight');
        setTimeout(() => {
            // Здесь будет код для загрузки содержимого новой страницы
            // Пока просто показываем сообщение
            tgApp.showPopup({
                title: pageIndex === -1 ? 'Рефералка' : 'Магазин',
                message: pageIndex === -1 ? 'Страница рефералки будет доступна позже' : 'Вернулись в магазин',
                buttons: [{type: 'ok'}]
            });
            
            appContainer.classList.remove('animate__fadeOutRight');
            appContainer.classList.add('animate__fadeInLeft');
            
            setTimeout(() => {
                appContainer.classList.remove('animate__animated', 'animate__fadeInLeft');
            }, 500);
        }, 300);
    } else {
        // Переход вправо
        appContainer.classList.add('animate__animated', 'animate__fadeOutLeft');
        setTimeout(() => {
            // Здесь будет код для загрузки содержимого новой страницы
            // Пока просто показываем сообщение
            tgApp.showPopup({
                title: pageIndex === 1 ? 'Биржа' : 'Магазин',
                message: pageIndex === 1 ? 'Страница биржи будет доступна позже' : 'Вернулись в магазин',
                buttons: [{type: 'ok'}]
            });
            
            appContainer.classList.remove('animate__fadeOutLeft');
            appContainer.classList.add('animate__fadeInRight');
            
            setTimeout(() => {
                appContainer.classList.remove('animate__animated', 'animate__fadeInRight');
            }, 500);
        }, 300);
    }
    
    // Обновляем текущую страницу
    currentPage = pageIndex;
    
    // Обновляем видимость навигационных стрелок
    updateNavigationArrows();
}

// Обновление видимости навигационных стрелок
function updateNavigationArrows() {
    // Всегда показываем обе стрелки, так как у нас есть страницы и слева, и справа
    leftNav.style.display = 'flex';
    rightNav.style.display = 'flex';
    
    // Но меняем их прозрачность в зависимости от текущей страницы
    leftNav.style.opacity = currentPage === -1 ? '0.5' : '';
    rightNav.style.opacity = currentPage === 1 ? '0.5' : '';
}

// Обработка свайпов
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 100; // Минимальное расстояние для определения свайпа
    
    if (touchEndX - touchStartX > swipeThreshold) {
        // Свайп вправо - переход на страницу слева
        if (currentPage > -1) {
            navigateToPage(currentPage - 1);
        }
    } else if (touchStartX - touchEndX > swipeThreshold) {
        // Свайп влево - переход на страницу справа
        if (currentPage < 1) {
            navigateToPage(currentPage + 1);
        }
    }
}

// Функция для получения контактов из Telegram
async function getContacts() {
    try {
        // Получаем информацию о текущем пользователе из initData
        const user = tgApp.initDataUnsafe?.user;
        if (user) {
            return [{
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || ''
            }];
        } else {
            console.log('Не удалось получить информацию о пользователе');
            return [];
        }
    } catch (error) {
        console.error('Ошибка при получении контактов:', error);
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

// Функция для отображения выпадающего списка контактов
async function showContactsDropdown() {
    // Получаем контакты
    const contacts = await getContacts();
    
    // Очищаем выпадающий список
    contactsDropdown.innerHTML = '';
    
    if (contacts && contacts.length > 0) {
        // Добавляем контакты в выпадающий список
        contacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            
            // Создаем аватар (первая буква имени)
            const avatar = document.createElement('div');
            avatar.className = 'contact-avatar';
            avatar.textContent = (contact.first_name || '?')[0].toUpperCase();
            
            // Создаем блок с информацией о контакте
            const contactInfo = document.createElement('div');
            contactInfo.className = 'contact-info';
            
            // Имя контакта
            const contactName = document.createElement('div');
            contactName.className = 'contact-name';
            contactName.textContent = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            
            // Username контакта
            const contactUsername = document.createElement('div');
            contactUsername.className = 'contact-username';
            contactUsername.textContent = contact.username ? `@${contact.username}` : '';
            
            // Собираем элементы
            contactInfo.appendChild(contactName);
            if (contact.username) {
                contactInfo.appendChild(contactUsername);
            }
            
            contactItem.appendChild(avatar);
            contactItem.appendChild(contactInfo);
            
            // Добавляем обработчик клика
            contactItem.addEventListener('click', () => {
                usernameInput.value = contact.username || '';
                hideContactsDropdown();
            });
            
            contactsDropdown.appendChild(contactItem);
        });
    } else {
        // Если контактов нет, показываем сообщение
        const noContacts = document.createElement('div');
        noContacts.className = 'no-contacts';
        noContacts.textContent = 'Нет доступных контактов';
        contactsDropdown.appendChild(noContacts);
    }
    
    // Показываем выпадающий список
    contactsDropdown.classList.add('active');
    
    // Добавляем обработчик клика вне выпадающего списка для его скрытия
    document.addEventListener('click', handleOutsideClick);
}

// Функция для скрытия выпадающего списка контактов
function hideContactsDropdown() {
    contactsDropdown.classList.remove('active');
    // Удаляем обработчик клика вне выпадающего списка
    document.removeEventListener('click', handleOutsideClick);
}

// Обработчик клика вне выпадающего списка
function handleOutsideClick(event) {
    // Если клик был не по выпадающему списку и не по полю ввода
    if (!contactsDropdown.contains(event.target) && event.target !== usernameInput) {
        hideContactsDropdown();
    }
}

// Обработчик фокуса на поле ввода username
usernameInput.addEventListener('focus', () => {
    showContactsDropdown();
});

// Обработчик ввода в поле username для фильтрации контактов
usernameInput.addEventListener('input', async () => {
    const searchText = usernameInput.value.toLowerCase();
    
    // Если выпадающий список не активен, активируем его
    if (!contactsDropdown.classList.contains('active')) {
        showContactsDropdown();
        return;
    }
    
    // Получаем все элементы контактов
    const contactItems = contactsDropdown.querySelectorAll('.contact-item');
    
    // Если нет элементов, значит список еще не загружен
    if (contactItems.length === 0) {
        return;
    }
    
    // Фильтруем контакты
    let hasVisibleContacts = false;
    
    contactItems.forEach(item => {
        const nameElement = item.querySelector('.contact-name');
        const usernameElement = item.querySelector('.contact-username');
        
        const name = nameElement ? nameElement.textContent.toLowerCase() : '';
        const username = usernameElement ? usernameElement.textContent.toLowerCase() : '';
        
        // Проверяем, содержит ли имя или username введенный текст
        if (name.includes(searchText) || username.includes(searchText)) {
            item.style.display = 'flex';
            hasVisibleContacts = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Если нет видимых контактов, показываем сообщение
    const noContactsElement = contactsDropdown.querySelector('.no-contacts');
    
    if (!hasVisibleContacts) {
        if (!noContactsElement) {
            const noContacts = document.createElement('div');
            noContacts.className = 'no-contacts';
            noContacts.textContent = 'Нет совпадений';
            contactsDropdown.appendChild(noContacts);
        } else {
            noContactsElement.textContent = 'Нет совпадений';
            noContactsElement.style.display = 'block';
        }
    } else if (noContactsElement) {
        noContactsElement.style.display = 'none';
    }
});

// Инициализация
function init() {
    // Обновляем цену
    updateCustomPrice();
    
    // Устанавливаем начальное состояние шагов
    step1.classList.add('active');
    step2.style.display = 'none';
    
    // Кнопка "Продолжить" всегда активна, так как у нас только кастомный пакет
    toStep2Btn.disabled = false;
    
    // Анимируем элементы при загрузке
    setTimeout(() => {
        animateOnScroll();
        animateStars();
    }, 500);
    
    // Инициализируем навигационные стрелки
    updateNavigationArrows();
}

// Запускаем инициализацию
init();
