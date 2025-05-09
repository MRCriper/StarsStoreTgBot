// Инициализация Telegram Web App
const tgApp = window.Telegram.WebApp;

// Адаптация к теме Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tgApp.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tgApp.textColor);
document.documentElement.style.setProperty('--tg-theme-hint-color', tgApp.textColor);
document.documentElement.style.setProperty('--tg-theme-link-color', tgApp.linkColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tgApp.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tgApp.buttonTextColor);

// Настройка Telegram Web App
tgApp.enableClosingConfirmation();
tgApp.expand();
tgApp.ready();

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

// Получаем элементы DOM
const usernameInput = document.getElementById('username');
const starsInput = document.getElementById('stars');
const decreaseBtn = document.getElementById('decrease');
const increaseBtn = document.getElementById('increase');
const priceElement = document.getElementById('price');
const buyButton = document.getElementById('buy-button');
const toStep2Btn = document.getElementById('to-step-2');
const backToStep1Btn = document.getElementById('back-to-step-1');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const summaryStars = document.getElementById('summary-stars');
const summaryPrice = document.getElementById('summary-price');
const loader = document.getElementById('loader');

// Элементы для навигации между страницами
const pagesContainer = document.querySelector('.pages-container');
const navArrowLeft = document.querySelector('.nav-arrow-left');
const navArrowRight = document.querySelector('.nav-arrow-right');
const referralPage = document.getElementById('referral-page');
const mainPage = document.getElementById('main-page');
const exchangePage = document.getElementById('exchange-page');
const copyReferralBtn = document.getElementById('copy-referral');
const referralCodeInput = document.getElementById('referral-code');
const buyStarsBtn = document.querySelector('.buy-stars-btn');
const sellStarsBtn = document.querySelector('.sell-stars-btn');

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

// Текущая страница (0 - Рефералка, 1 - Магазин, 2 - Биржа)
let currentPage = 1; // По умолчанию показываем страницу магазина

// Функция для переключения страниц
function goToPage(pageIndex) {
    // Проверяем границы
    if (pageIndex < 0) pageIndex = 0;
    if (pageIndex > 2) pageIndex = 2;
    
    // Сохраняем текущую страницу
    currentPage = pageIndex;
    
    // Анимируем переход
    pagesContainer.style.transform = `translateX(-${currentPage * 33.333}%)`;
    
    // Обновляем видимость стрелок
    updateArrowsVisibility();
}

// Обновление видимости стрелок в зависимости от текущей страницы
function updateArrowsVisibility() {
    // Всегда показываем обе стрелки, но меняем их прозрачность
    navArrowLeft.style.opacity = currentPage === 0 ? '0.3' : '0.8';
    navArrowRight.style.opacity = currentPage === 2 ? '0.3' : '0.8';
    
    // Отключаем события для крайних стрелок
    navArrowLeft.style.pointerEvents = currentPage === 0 ? 'none' : 'auto';
    navArrowRight.style.pointerEvents = currentPage === 2 ? 'none' : 'auto';
}

// Обработчики для навигационных стрелок
navArrowLeft.addEventListener('click', () => {
    if (currentPage > 0) {
        goToPage(currentPage - 1);
    }
});

navArrowRight.addEventListener('click', () => {
    if (currentPage < 2) {
        goToPage(currentPage + 1);
    }
});

// Инициализация свайпа с помощью Hammer.js
function initSwipe() {
    const hammer = new Hammer(pagesContainer);
    
    // Настройка распознавания свайпа
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    
    // Обработчик свайпа влево (следующая страница)
    hammer.on('swipeleft', () => {
        if (currentPage < 2) {
            goToPage(currentPage + 1);
        }
    });
    
    // Обработчик свайпа вправо (предыдущая страница)
    hammer.on('swiperight', () => {
        if (currentPage > 0) {
            goToPage(currentPage - 1);
        }
    });
}

// Обработчик для кнопки копирования реферальной ссылки
if (copyReferralBtn) {
    copyReferralBtn.addEventListener('click', () => {
        // Выделяем текст
        referralCodeInput.select();
        referralCodeInput.setSelectionRange(0, 99999);
        
        // Копируем в буфер обмена
        navigator.clipboard.writeText(referralCodeInput.value)
            .then(() => {
                // Визуальная обратная связь
                copyReferralBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyReferralBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
                
                // Показываем уведомление
                tgApp.showPopup({
                    title: 'Успешно',
                    message: 'Реферальная ссылка скопирована в буфер обмена',
                    buttons: [{type: 'ok'}]
                });
            })
            .catch(err => {
                console.error('Не удалось скопировать: ', err);
                
                // Показываем уведомление об ошибке
                tgApp.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось скопировать ссылку. Пожалуйста, скопируйте вручную.',
                    buttons: [{type: 'ok'}]
                });
            });
    });
}

// Обработчики для кнопок на странице биржи
if (buyStarsBtn) {
    buyStarsBtn.addEventListener('click', () => {
        // Переходим на страницу магазина
        goToPage(1);
    });
}

if (sellStarsBtn) {
    sellStarsBtn.addEventListener('click', () => {
        // Показываем уведомление
        tgApp.showPopup({
            title: 'Скоро',
            message: 'Функция продажи звезд будет доступна в ближайшее время',
            buttons: [{type: 'ok'}]
        });
    });
}

// Инициализация
function init() {
    // Обновляем цену
    updateCustomPrice();
    
    // Устанавливаем начальное состояние шагов
    step1.classList.add('active');
    step2.style.display = 'none';
    
    // Кнопка "Продолжить" всегда активна, так как у нас только кастомный пакет
    toStep2Btn.disabled = false;
    
    // Инициализируем свайп
    initSwipe();
    
    // Устанавливаем начальную страницу (магазин)
    goToPage(1);
    
    // Анимируем элементы при загрузке
    setTimeout(() => {
        animateOnScroll();
        animateStars();
    }, 500);
}

// Запускаем инициализацию
init();
