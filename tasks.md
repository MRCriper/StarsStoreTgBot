# План работы по исправлению проблем в TG Stars Store Bot

## Проблема 1: Реферальная ссылка создаётся не для моего бота

### Анализ проблемы
В текущей реализации реферальная ссылка генерируется с неправильным именем бота. В файле `app.js` функция `generateTemporaryReferralData` создаёт ссылку с именем `StarsStoreBot`, которое может не соответствовать фактическому имени бота.

### Решение
1. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\app.js`
   - **Строки:** ~290-300
   - **Изменения:** Исправить функцию `generateTemporaryReferralData`, чтобы она использовала правильное имя бота из переменных окружения или конфигурации
   - **Код для изменения:**
   ```javascript
   referralData = {
       referralLink: `https://t.me/StarsStoreBot?start=ref_${username}_${uniqueCode}`,
       // другие поля
   };
   ```
   - **Новый код:**
   ```javascript
   // Получаем имя бота из конфигурации или используем значение по умолчанию
   const botName = window.Telegram.WebApp.initDataUnsafe.start_param?.split('_')[0] || 'TGStarsBot';
   referralData = {
       referralLink: `https://t.me/${botName}?start=ref_${username}_${uniqueCode}`,
       // другие поля
   };
   ```

2. **Файл:** `c:\Coding\Github\StarsStoreTgBot\bot.js`
   - **Строки:** ~60-80
   - **Изменения:** Убедиться, что функция `addReferral` правильно обрабатывает реферальные ссылки

## Проблема 2: Кнопка биржи пропадает при переходе между страницами

### Анализ проблемы
При переходе между страницами состояние кнопки биржи не сохраняется должным образом. В функции `switchToPage` есть логика для сохранения состояния кнопки биржи, но она работает только при переходе с реферальной страницы на главную.

### Решение
1. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\app.js`
   - **Строки:** ~80-120
   - **Изменения:** Модифицировать функцию `switchToPage`, чтобы она правильно сохраняла и восстанавливала состояние кнопки биржи при любых переходах
   - **Код для изменения:**
   ```javascript
   // Восстанавливаем состояние кнопки биржи, если мы вернулись с реферальной страницы
   if (prevPage === 'referral' && interfaceState.exchangeButtonVisible) {
       // Находим кнопку биржи по ID или классу
       const exchangeButton = document.querySelector('.exchange-button');
       if (exchangeButton) {
           exchangeButton.style.display = 'flex';
       }
   }
   ```
   - **Новый код:**
   ```javascript
   // Восстанавливаем состояние кнопки биржи при любом переходе между страницами
   const exchangeButton = document.querySelector('.exchange-button');
   if (exchangeButton && interfaceState.exchangeButtonVisible) {
       exchangeButton.style.display = 'flex';
   }
   ```

2. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\app.js`
   - **Строки:** ~500-550
   - **Изменения:** Обновить обработчики событий для кнопок навигации, чтобы они сохраняли состояние кнопки биржи

## Проблема 3: При переходе между страницами они могут смешаться и встать друг под другом

### Анализ проблемы
Проблема связана с анимацией переходов между страницами. В текущей реализации есть несколько функций для переключения страниц (`switchToPage`, обработчики для кнопок `toStep2Btn` и `backToStep1Btn`), которые используют разные подходы к анимации, что может приводить к наложению страниц.

### Решение
1. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\app.js`
   - **Строки:** ~80-150
   - **Изменения:** Унифицировать логику переключения страниц в функции `switchToPage`
   - **Код для изменения:**
   ```javascript
   // Добавляем анимацию перехода между страницами
   if (prevPage && prevPage !== pageName) {
       addPageTransitionAnimation(prevPage, pageName);
   }
   ```
   - **Новый код:**
   ```javascript
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
   ```

2. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\app.js`
   - **Строки:** ~500-550
   - **Изменения:** Обновить обработчики для кнопок `toStep2Btn` и `backToStep1Btn`, чтобы они использовали функцию `switchToPage` вместо прямого манипулирования DOM
   - **Код для изменения:**
   ```javascript
   // Переключаем шаги с анимацией свайпа
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
   ```
   - **Новый код:**
   ```javascript
   // Используем единую функцию для переключения страниц
   switchToPage('step-2');
   
   // Фокус на поле ввода имени пользователя
   setTimeout(() => {
       usernameInput.focus();
   }, 600);
   ```

3. **Файл:** `c:\Coding\Github\StarsStoreTgBot\public\styles.css`
   - **Строки:** ~100-150
   - **Изменения:** Добавить или обновить CSS-правила для страниц, чтобы предотвратить их наложение
   - **Добавить код:**
   ```css
   .page {
       position: absolute;
       width: 100%;
       transition: transform 0.3s ease, opacity 0.3s ease;
       opacity: 0;
       transform: translateX(100%);
       display: none;
   }
   
   .page.active {
       opacity: 1;
       transform: translateX(0);
       display: block;
       z-index: 1;
   }
   ```

## Дополнительные рекомендации

1. **Тестирование:** После внесения изменений необходимо тщательно протестировать все сценарии использования приложения, особенно переходы между страницами и работу реферальной системы.

2. **Оптимизация кода:** Рассмотреть возможность рефакторинга кода для улучшения его структуры и читаемости, особенно в части управления состоянием интерфейса и анимациями.

3. **Обработка ошибок:** Добавить более надежную обработку ошибок для функций, связанных с реферальной системой и API-запросами.