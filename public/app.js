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
        // Получаем данные текущего пользователя из Telegram
        const user = tgApp.initDataUnsafe?.user;
        const contacts = [];
        
        // Добавляем текущего пользователя в список контактов, если данные доступны
        if (user) {
            contacts.push({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                phone_number: '',
                is_current_user: true
            });
        }
        
        // Пробуем получить контакты из localStorage
        try {
            const savedContacts = localStorage.getItem('savedContacts');
            if (savedContacts) {
                const parsedContacts = JSON.parse(savedContacts);
                // Фильтруем, чтобы избежать дубликатов
                const filteredContacts = parsedContacts.filter(contact => 
                    !contacts.some(c => c.username === contact.username && contact.username)
                );
                contacts.push(...filteredContacts);
            }
        } catch (storageError) {
            console.log('Ошибка при получении сохраненных контактов:', storageError);
        }
        
        // Если в Telegram доступен API для получения контактов, пробуем его использовать
        if (tgApp.isVersionAtLeast('6.9')) {
            try {
                // Пробуем получить контакты через WebApp API
                const contactsData = await new Promise((resolve) => {
                    // Создаем уникальный идентификатор запроса
                    const reqId = `get_contacts_${Date.now()}`;
                    
                    // Функция для обработки события получения контактов
                    const handleContactsReceived = (event) => {
                        try {
                            // Для веб-версии
                            if (typeof event.data === 'string') {
                                const data = JSON.parse(event.data);
                                if (data.eventType === 'contacts_received' && data.eventData && data.eventData.reqId === reqId) {
                                    window.removeEventListener('message', handleContactsReceived);
                                    resolve(data.eventData.contacts || []);
                                }
                            }
                            // Для мобильных приложений
                            else if (event.detail && event.detail.eventType === 'contacts_received') {
                                window.removeEventListener('tgwebapp:contacts_received', handleContactsReceived);
                                resolve(event.detail.contacts || []);
                            }
                        } catch (e) {
                            console.error('Ошибка при обработке события получения контактов:', e);
                        }
                    };
                    
                    // Добавляем обработчики событий
                    window.addEventListener('message', handleContactsReceived);
                    window.addEventListener('tgwebapp:contacts_received', handleContactsReceived);
                    
                    // Отправляем запрос на получение контактов
                    if (window.TelegramWebviewProxy) {
                        // Для мобильных приложений
                        window.TelegramWebviewProxy.postEvent('web_app_request_contacts', JSON.stringify({ reqId }));
                    } else {
                        // Для веб-версии
                        window.parent.postMessage(JSON.stringify({
                            eventType: 'web_app_request_contacts',
                            eventData: { reqId }
                        }), '*');
                    }
                    
                    // Устанавливаем таймаут
                    setTimeout(() => {
                        window.removeEventListener('message', handleContactsReceived);
                        window.removeEventListener('tgwebapp:contacts_received', handleContactsReceived);
                        resolve([]);
                    }, 5000); // 5 секунд таймаут
                });
                
                if (contactsData && contactsData.length > 0) {
                    // Преобразуем контакты в нужный формат
                    const formattedContacts = contactsData.map(contact => ({
                        first_name: contact.first_name || '',
                        last_name: contact.last_name || '',
                        username: contact.username || '',
                        phone_number: contact.phone_number || '',
                        is_current_user: false
                    }));
                    
                    // Фильтруем, чтобы избежать дубликатов
                    const filteredTgContacts = formattedContacts.filter(contact => 
                        contact.username && !contacts.some(c => c.username === contact.username)
                    );
                    
                    contacts.push(...filteredTgContacts);
                    
                    // Сохраняем полученные контакты в localStorage
                    filteredTgContacts.forEach(contact => saveContact(contact));
                }
            } catch (tgError) {
                console.log('Ошибка при получении контактов из Telegram API:', tgError);
            }
        }
        
        return contacts;
    } catch (error) {
        console.error('Ошибка при получении контактов:', error);
        
        // В случае ошибки возвращаем массив с текущим пользователем, если данные доступны
        const user = tgApp.initDataUnsafe?.user;
        if (user) {
            return [{
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                phone_number: '',
                is_current_user: true
            }];
        }
        
        // Если данные пользователя недоступны, возвращаем пустой массив
        return [];
    }
}

// Функция для сохранения контакта в localStorage
function saveContact(contact) {
    try {
        // Получаем текущие сохраненные контакты
        const savedContacts = localStorage.getItem('savedContacts');
        let contacts = [];
        
        if (savedContacts) {
            contacts = JSON.parse(savedContacts);
        }
        
        // Проверяем, есть ли уже такой контакт
        const existingContactIndex = contacts.findIndex(c => 
            c.username === contact.username && contact.username
        );
        
        if (existingContactIndex !== -1) {
            // Обновляем существующий контакт
            contacts[existingContactIndex] = contact;
        } else {
            // Добавляем новый контакт
            contacts.push(contact);
        }
        
        // Ограничиваем количество сохраненных контактов до 10
        if (contacts.length > 10) {
            contacts = contacts.slice(-10);
        }
        
        // Сохраняем обновленный список контактов
        localStorage.setItem('savedContacts', JSON.stringify(contacts));
        
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
        return false;
    }
}

// Функция для запроса контакта через Telegram API
async function requestContactFromTelegram() {
    try {
        // Показываем индикатор загрузки
        const loadingPopup = tgApp.showPopup({
            title: 'Загрузка',
            message: 'Открываем выбор контакта...',
            buttons: []
        });
        
        // Проверяем версию Telegram для использования правильного API
        if (tgApp.isVersionAtLeast('6.9')) {
            try {
                // Создаем уникальный идентификатор запроса
                const reqId = `get_contact_${Date.now()}`;
                
                // Создаем Promise для ожидания ответа
                const contactPromise = new Promise((resolve, reject) => {
                    // Функция для обработки события получения контакта
                    const handleContactReceived = (event) => {
                        try {
                            // Для веб-версии
                            if (typeof event.data === 'string') {
                                try {
                                    const data = JSON.parse(event.data);
                                    if (data.eventType === 'contact_selected' && data.eventData && data.eventData.reqId === reqId) {
                                        window.removeEventListener('message', handleContactReceived);
                                        resolve(data.eventData.contact || null);
                                    }
                                } catch (e) {
                                    console.log('Ошибка при парсинге данных события:', e);
                                }
                            }
                            // Для мобильных приложений
                            else if (event.detail && event.detail.eventType === 'contact_selected') {
                                window.removeEventListener('tgwebapp:contact_selected', handleContactReceived);
                                resolve(event.detail.contact || null);
                            }
                        } catch (e) {
                            console.error('Ошибка при обработке события получения контакта:', e);
                        }
                    };
                    
                    // Добавляем обработчики событий
                    window.addEventListener('message', handleContactReceived);
                    window.addEventListener('tgwebapp:contact_selected', handleContactReceived);
                    
                    // Устанавливаем таймаут
                    setTimeout(() => {
                        window.removeEventListener('message', handleContactReceived);
                        window.removeEventListener('tgwebapp:contact_selected', handleContactReceived);
                        reject(new Error('Таймаут при ожидании выбора контакта'));
                    }, 60000); // 60 секунд таймаут
                });
                
                // Отправляем запрос на выбор контакта
                if (window.TelegramWebviewProxy) {
                    // Для мобильных приложений
                    window.TelegramWebviewProxy.postEvent('web_app_request_contact', JSON.stringify({ reqId }));
                } else {
                    // Для веб-версии
                    window.parent.postMessage(JSON.stringify({
                        eventType: 'web_app_request_contact',
                        eventData: { reqId }
                    }), '*');
                }
                
                // Ожидаем ответа
                const contactData = await contactPromise;
                
                // Закрываем индикатор загрузки
                if (loadingPopup && loadingPopup.close) {
                    loadingPopup.close();
                }
                
                if (contactData) {
                    console.log('Получен контакт:', contactData);
                    
                    // Создаем объект контакта
                    const newContact = {
                        first_name: contactData.first_name || '',
                        last_name: contactData.last_name || '',
                        username: contactData.username || '',
                        phone_number: contactData.phone_number || '',
                        is_current_user: false
                    };
                    
                    // Сохраняем контакт
                    saveContact(newContact);
                    
                    return newContact;
                }
            } catch (error) {
                console.error('Ошибка при запросе контакта:', error);
                
                // Закрываем индикатор загрузки
                if (loadingPopup && loadingPopup.close) {
                    loadingPopup.close();
                }
                
                // Показываем сообщение об ошибке
                tgApp.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось получить контакт. Пожалуйста, введите имя пользователя вручную',
                    buttons: [{type: 'ok'}]
                });
            }
        } else {
            // Закрываем индикатор загрузки
            if (loadingPopup && loadingPopup.close) {
                loadingPopup.close();
            }
            
            // Для старых версий Telegram показываем сообщение
            tgApp.showPopup({
                title: 'Выбор контакта',
                message: 'К сожалению, ваша версия Telegram не поддерживает выбор контактов. Пожалуйста, введите имя пользователя вручную.',
                buttons: [{type: 'ok'}]
            });
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка при запросе контакта:', error);
        
        // Показываем сообщение об ошибке
        tgApp.showPopup({
            title: 'Ошибка',
            message: 'Не удалось получить контакт. Пожалуйста, введите имя пользователя вручную',
            buttons: [{type: 'ok'}]
        });
        
        return null;
    }
}

// Функция для отображения выпадающего списка контактов
async function showContactsDropdown() {
    // Показываем индикатор загрузки в выпадающем списке
    contactsDropdown.innerHTML = '<div class="loading-contacts">Загрузка контактов...</div>';
    contactsDropdown.classList.add('active');
    
    // Получаем контакты
    const contacts = await getContacts();
    
    // Очищаем выпадающий список
    contactsDropdown.innerHTML = '';
    
    if (contacts && contacts.length > 0) {
        // Добавляем контакты в выпадающий список
        contacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            
            // Добавляем класс для текущего пользователя
            if (contact.is_current_user) {
                contactItem.classList.add('current-user');
            }
            
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
            
            // Добавляем метку "Вы" для текущего пользователя
            if (contact.is_current_user) {
                const currentUserBadge = document.createElement('span');
                currentUserBadge.className = 'current-user-badge';
                currentUserBadge.textContent = 'Вы';
                contactName.appendChild(currentUserBadge);
            }
            
            // Username контакта
            const contactUsername = document.createElement('div');
            contactUsername.className = 'contact-username';
            contactUsername.textContent = contact.username ? `@${contact.username}` : '';
            
            // Телефон контакта (если есть)
            if (contact.phone_number) {
                const contactPhone = document.createElement('div');
                contactPhone.className = 'contact-phone';
                contactPhone.textContent = contact.phone_number;
                contactInfo.appendChild(contactPhone);
            }
            
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
                
                // Анимация выбора контакта
                contactItem.classList.add('selected');
                setTimeout(() => {
                    contactItem.classList.remove('selected');
                }, 300);
            });
            
            contactsDropdown.appendChild(contactItem);
        });
        
        // Добавляем кнопку для выбора контакта через нативный интерфейс Telegram
        const selectContactButton = document.createElement('div');
        selectContactButton.className = 'select-contact-btn';
        selectContactButton.innerHTML = '<i class="fas fa-user-plus"></i> Выбрать контакт из Telegram';
        selectContactButton.addEventListener('click', async () => {
            try {
                // Скрываем выпадающий список на время выбора контакта
                hideContactsDropdown();
                
                // Запрашиваем контакт через Telegram API
                const contact = await requestContactFromTelegram();
                
                if (contact) {
                    // Если у контакта есть username, используем его
                    if (contact.username) {
                        usernameInput.value = contact.username;
                    } 
                    // Если username нет, но есть имя, используем его
                    else if (contact.first_name) {
                        // Сохраняем контакт в любом случае
                        saveContact(contact);
                        
                        // Если есть имя и фамилия, используем их вместе
                        if (contact.last_name) {
                            usernameInput.value = `${contact.first_name} ${contact.last_name}`;
                        } else {
                            usernameInput.value = contact.first_name;
                        }
                    }
                    
                    // Добавляем небольшую задержку перед обновлением списка
                    setTimeout(() => {
                        // Обновляем список контактов
                        showContactsDropdown();
                    }, 300);
                } else {
                    // Снова показываем выпадающий список
                    showContactsDropdown();
                }
            } catch (error) {
                console.error('Ошибка при запросе контакта:', error);
                
                // Показываем сообщение об ошибке
                tgApp.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось получить контакт. Пожалуйста, введите имя пользователя вручную',
                    buttons: [{type: 'ok'}]
                });
                
                // Снова показываем выпадающий список
                showContactsDropdown();
            }
        });
        contactsDropdown.appendChild(selectContactButton);
        
        // Добавляем кнопку для ручного ввода контакта
        const manualInputButton = document.createElement('div');
        manualInputButton.className = 'select-contact-btn manual-input-btn';
        manualInputButton.innerHTML = '<i class="fas fa-keyboard"></i> Ввести вручную';
        manualInputButton.addEventListener('click', () => {
            // Скрываем выпадающий список
            hideContactsDropdown();
            
            // Фокусируемся на поле ввода
            usernameInput.focus();
            
            // Очищаем поле ввода, если в нем уже есть текст
            if (usernameInput.value) {
                usernameInput.value = '';
            }
        });
        contactsDropdown.appendChild(manualInputButton);
    } else {
        // Если контактов нет, показываем сообщение
        const noContacts = document.createElement('div');
        noContacts.className = 'no-contacts';
        noContacts.textContent = 'Нет доступных контактов';
        contactsDropdown.appendChild(noContacts);
        
        // Добавляем кнопку для выбора контакта через нативный интерфейс Telegram
        const selectContactButton = document.createElement('div');
        selectContactButton.className = 'select-contact-btn';
        selectContactButton.innerHTML = '<i class="fas fa-user-plus"></i> Выбрать контакт из Telegram';
        selectContactButton.addEventListener('click', async () => {
            try {
                // Скрываем выпадающий список на время выбора контакта
                hideContactsDropdown();
                
                // Запрашиваем контакт через Telegram API
                const contact = await requestContactFromTelegram();
                
                if (contact) {
                    // Если у контакта есть username, используем его
                    if (contact.username) {
                        usernameInput.value = contact.username;
                    } 
                    // Если username нет, но есть имя, используем его
                    else if (contact.first_name) {
                        // Сохраняем контакт в любом случае
                        saveContact(contact);
                        
                        // Если есть имя и фамилия, используем их вместе
                        if (contact.last_name) {
                            usernameInput.value = `${contact.first_name} ${contact.last_name}`;
                        } else {
                            usernameInput.value = contact.first_name;
                        }
                    }
                    
                    // Добавляем небольшую задержку перед обновлением списка
                    setTimeout(() => {
                        // Обновляем список контактов
                        showContactsDropdown();
                    }, 300);
                } else {
                    // Снова показываем выпадающий список
                    showContactsDropdown();
                }
            } catch (error) {
                console.error('Ошибка при запросе контакта:', error);
                
                // Показываем сообщение об ошибке
                tgApp.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось получить контакт. Пожалуйста, введите имя пользователя вручную',
                    buttons: [{type: 'ok'}]
                });
                
                // Снова показываем выпадающий список
                showContactsDropdown();
            }
        });
        contactsDropdown.appendChild(selectContactButton);
    }
    
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
