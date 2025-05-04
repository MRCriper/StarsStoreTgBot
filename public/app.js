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

// Цена за одну звезду (в рублях)
const PRICE_PER_STAR = 1.5;

// Максимальное количество звезд
const MAX_STARS = 1000;

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
    const stars = parseInt(starsInput.value) || 1;
    const totalPrice = stars * PRICE_PER_STAR;
    priceElement.textContent = formatPrice(totalPrice).replace(' ₽', '');
    
    // Обновляем состояние кнопок
    decreaseBtn.disabled = stars <= 1;
    increaseBtn.disabled = stars >= MAX_STARS;
    
    // Визуальная обратная связь
    if (stars <= 1) {
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
    const currentValue = parseInt(starsInput.value) || 1;
    if (currentValue > 1) {
        starsInput.value = currentValue - 1;
        updateCustomPrice();
    }
});

increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(starsInput.value) || 1;
    if (currentValue < MAX_STARS) {
        starsInput.value = currentValue + 1;
        updateCustomPrice();
    }
});

// Обработчик изменения значения в поле ввода
starsInput.addEventListener('input', () => {
    let value = parseInt(starsInput.value) || 1;
    
    // Ограничиваем значение
    if (value < 1) value = 1;
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

// Обработчик для выбора пакета
packages.forEach(packageEl => {
    packageEl.addEventListener('click', () => {
        // Удаляем класс selected у всех пакетов
        packages.forEach(p => p.classList.remove('selected'));
        
        // Добавляем класс selected к выбранному пакету
        packageEl.classList.add('selected');
        
        // Получаем данные о пакете
        selectedStars = parseInt(packageEl.dataset.stars);
        selectedPrice = parseInt(packageEl.dataset.price);
        selectedPackage = packageEl;
        
        // Обновляем кнопку "Продолжить"
        toStep2Btn.disabled = false;
        
        // Анимация выбора
        packageEl.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
            packageEl.classList.remove('animate__animated', 'animate__pulse');
        }, 500);
    });
});

// Обработчик для кнопки "Продолжить" в пользовательском пакете
customPackageBtn.addEventListener('click', () => {
    // Удаляем класс selected у всех пакетов
    packages.forEach(p => p.classList.remove('selected'));
    
    // Получаем данные о пользовательском пакете
    selectedStars = parseInt(starsInput.value) || 1;
    selectedPrice = selectedStars * PRICE_PER_STAR;
    selectedPackage = null;
    
    // Обновляем кнопку "Продолжить"
    toStep2Btn.disabled = false;
    
    // Анимация выбора
    customPackageBtn.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        customPackageBtn.classList.remove('animate__animated', 'animate__pulse');
    }, 500);
});

// Обработчик для кнопки "Продолжить" к шагу 2
toStep2Btn.addEventListener('click', () => {
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

// Обработчик для кнопок выбора пакета
document.querySelectorAll('.select-package-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        
        // Находим родительский элемент пакета
        const packageEl = btn.closest('.package');
        if (packageEl) {
            // Удаляем класс selected у всех пакетов
            packages.forEach(p => p.classList.remove('selected'));
            
            // Добавляем класс selected к выбранному пакету
            packageEl.classList.add('selected');
            
            // Получаем данные о пакете
            selectedStars = parseInt(packageEl.dataset.stars);
            selectedPrice = parseInt(packageEl.dataset.price);
            selectedPackage = packageEl;
            
            // Обновляем кнопку "Продолжить"
            toStep2Btn.disabled = false;
            
            // Анимация выбора
            packageEl.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                packageEl.classList.remove('animate__animated', 'animate__pulse');
            }, 500);
            
            // Автоматически переходим к шагу 2
            setTimeout(() => {
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
            }, 500);
        }
    });
});

// Добавляем анимации при прокрутке
function animateOnScroll() {
    const elements = document.querySelectorAll('.package, .custom-package');
    
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

// Инициализация
function init() {
    // Обновляем цену
    updateCustomPrice();
    
    // Устанавливаем начальное состояние шагов
    step1.classList.add('active');
    step2.style.display = 'none';
    
    // Анимируем элементы при загрузке
    setTimeout(() => {
        animateOnScroll();
        animateStars();
    }, 500);
}

// Запускаем инициализацию
init();
