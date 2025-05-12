# План реализации выпадающего списка контактов для поля ввода username

## Описание задачи
Реализовать функционал, который при нажатии на поле ввода username при оплате будет показывать выпадающий список пользователей (никнейм, username, аватарка):
- Текущий пользователь (первый в списке)
- Контакты пользователя
- Возможность поиска по никнейму или username
- При выборе пользователя его username вставляется в поле ввода

## Технический план реализации

### 1. Подготовка интерфейса
- Обновить стили для выпадающего списка контактов
- Добавить индикатор загрузки для отображения процесса получения контактов
- Обеспечить корректное отображение аватарок пользователей

### 2. Получение данных пользователя и контактов
- Использовать Telegram Mini Apps API для получения данных текущего пользователя
- Реализовать запрос разрешения на доступ к контактам через `requestContactAccess()`
- Получить список контактов пользователя через `getContacts()`
- Обработать и сохранить полученные данные для быстрого доступа

### 3. Реализация выпадающего списка
- Создать функцию для отображения выпадающего списка при фокусе на поле ввода
- Реализовать отображение текущего пользователя в начале списка
- Добавить отображение контактов пользователя с никнеймами, username и аватарками
- Реализовать обработчики событий для выбора контакта из списка

### 4. Функционал поиска
- Добавить обработчик ввода для поиска по никнейму или username
- Реализовать фильтрацию списка контактов в реальном времени при вводе
- Обеспечить подсветку совпадающих частей текста при поиске

### 5. Обработка выбора контакта
- Реализовать вставку username выбранного контакта в поле ввода
- Скрывать выпадающий список после выбора контакта
- Добавить обработчик клика вне выпадающего списка для его закрытия

### 6. Кэширование данных
- Реализовать сохранение полученных контактов в localStorage для быстрого доступа
- Обновлять кэш при получении новых контактов

### 7. Обработка ошибок
- Добавить обработку ошибок при запросе доступа к контактам
- Предусмотреть альтернативный сценарий, если пользователь отказал в доступе к контактам

## Примерный код реализации

```javascript
// Основные функции для работы с контактами

// 1. Инициализация и обработчики событий
function initContactsDropdown() {
  const usernameInput = document.getElementById('username');
  const contactsDropdown = document.getElementById('contacts-dropdown');
  
  // Показываем выпадающий список при фокусе на поле ввода
  usernameInput.addEventListener('focus', showContactsDropdown);
  
  // Обработчик ввода для поиска
  usernameInput.addEventListener('input', filterContacts);
  
  // Обработчик клика вне выпадающего списка
  document.addEventListener('click', handleOutsideClick);
}

// 2. Получение контактов из Telegram API
async function fetchContacts() {
  try {
    // Получаем данные текущего пользователя
    const user = tgApp.initDataUnsafe?.user;
    let contacts = [];
    
    // Добавляем текущего пользователя в начало списка
    if (user && user.username) {
      contacts.push({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username,
        photo_url: user.photo_url || '',
        is_current_user: true
      });
    }
    
    // Запрашиваем доступ к контактам
    if (tgApp.isVersionAtLeast('6.9')) {
      const accessResult = await tgApp.requestContactAccess();
      
      if (accessResult) {
        // Получаем список контактов
        const contactsList = await tgApp.getContacts();
        
        if (contactsList && contactsList.length > 0) {
          // Обрабатываем полученные контакты
          contactsList.forEach(contact => {
            if (contact.username) {
              contacts.push({
                first_name: contact.first_name || '',
                last_name: contact.last_name || '',
                username: contact.username,
                photo_url: contact.photo_url || '',
                is_current_user: false
              });
            }
          });
          
          // Сохраняем контакты в localStorage
          saveContactsToCache(contacts);
        }
      }
    }
    
    return contacts;
  } catch (error) {
    console.error('Ошибка при получении контактов:', error);
    return [];
  }
}

// 3. Отображение выпадающего списка контактов
async function showContactsDropdown() {
  // Показываем индикатор загрузки
  contactsDropdown.innerHTML = '<div class="loading-contacts">Загрузка контактов...</div>';
  contactsDropdown.classList.add('active');
  
  // Пробуем получить контакты из кэша
  let contacts = getContactsFromCache();
  
  // Если кэш пуст или устарел, запрашиваем контакты заново
  if (!contacts || contacts.length <= 1) {
    contacts = await fetchContacts();
  }
  
  // Отображаем контакты
  renderContacts(contacts);
  
  // Добавляем обработчик клика вне выпадающего списка
  document.addEventListener('click', handleOutsideClick);
}

// 4. Отрисовка контактов в выпадающем списке
function renderContacts(contacts) {
  // Очищаем выпадающий список
  contactsDropdown.innerHTML = '';
  
  // Если контактов нет, показываем сообщение
  if (!contacts || contacts.length === 0) {
    contactsDropdown.innerHTML = '<div class="contact-item">Нет доступных контактов</div>';
    return;
  }
  
  // Добавляем контакты в выпадающий список
  contacts.forEach(contact => {
    const contactItem = document.createElement('div');
    contactItem.className = 'contact-item';
    if (contact.is_current_user) {
      contactItem.classList.add('current-user');
    }
    
    // Формируем имя контакта
    let contactName = contact.first_name;
    if (contact.last_name) contactName += ' ' + contact.last_name;
    if (contact.is_current_user) contactName += ' (Вы)';
    
    // Добавляем имя пользователя, если оно есть
    const usernameText = contact.username ? `@${contact.username}` : '';
    
    // Создаем HTML для элемента контакта с аватаркой
    contactItem.innerHTML = `
      <div class="contact-avatar">
        ${contact.photo_url ? `<img src="${contact.photo_url}" alt="${contactName}">` : '<div class="default-avatar"></div>'}
      </div>
      <div class="contact-info">
        <div class="contact-name">${contactName}</div>
        <div class="contact-username">${usernameText}</div>
      </div>
    `;
    
    // Добавляем обработчик клика
    contactItem.addEventListener('click', () => {
      // Устанавливаем имя пользователя в поле ввода
      if (contact.username) {
        usernameInput.value = contact.username;
      }
      
      // Скрываем выпадающий список
      hideContactsDropdown();
    });
    
    // Добавляем элемент в выпадающий список
    contactsDropdown.appendChild(contactItem);
  });
}

// 5. Фильтрация контактов при вводе
function filterContacts() {
  const searchText = usernameInput.value.toLowerCase();
  const contacts = getContactsFromCache();
  
  if (!contacts || contacts.length === 0) return;
  
  // Фильтруем контакты по введенному тексту
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const username = (contact.username || '').toLowerCase();
    
    return fullName.includes(searchText) || username.includes(searchText);
  });
  
  // Отображаем отфильтрованные контакты
  renderContacts(filteredContacts);
}

// 6. Обработка клика вне выпадающего списка
function handleOutsideClick(event) {
  if (!contactsDropdown.contains(event.target) && event.target !== usernameInput) {
    hideContactsDropdown();
  }
}

// 7. Скрытие выпадающего списка
function hideContactsDropdown() {
  contactsDropdown.classList.remove('active');
  document.removeEventListener('click', handleOutsideClick);
}

// 8. Работа с кэшем контактов
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
```

## Тестирование

1. Проверить отображение выпадающего списка при фокусе на поле ввода
2. Проверить корректное отображение текущего пользователя в начале списка
3. Проверить запрос разрешения на доступ к контактам
4. Проверить отображение контактов пользователя
5. Проверить работу поиска по никнейму и username
6. Проверить вставку username при выборе контакта
7. Проверить закрытие выпадающего списка при клике вне его области
8. Проверить работу кэширования контактов
9. Проверить обработку ошибок при отказе в доступе к контактам

## Примечания

- Для работы с контактами требуется Telegram версии 6.9 или выше
- Необходимо запрашивать разрешение на доступ к контактам через `requestContactAccess()`
- При отказе в доступе к контактам пользователь сможет вводить username вручную
- Кэширование контактов позволит ускорить работу приложения при повторном использовании