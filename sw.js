// Версия Service Worker - изменяйте при обновлении
const CACHE_VERSION = 'chaos-organizer-v1.0.0';
const CACHE_NAME = CACHE_VERSION;

// Список файлов для кэширования
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/browserconfig.xml',
  
  // Иконки
  '/favicon.ico',
  '/chat.png',
  '/chat-256x256.png',
  '/badge-128x128.png',
];

// Список URL для кэширования во время выполнения
const RUNTIME_CACHE_PATTERNS = [
  // API endpoints
  /^\/api\/auth\/check/,
  /^\/api\/user\/profile/,
  /^\/api\/chats/,
  
  // Статические ресурсы
  /^\/assets\/fonts\//,
  /^\/assets\/images\//,
  /^\/assets\/icons\//,
  /^\/assets\/sounds\//,
];

// Список URL, которые всегда должны идти в сеть
const NETWORK_ONLY_URLS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/messages/send',
  '/api/upload',
  '/ws',
];

// Максимальный размер кэша (50MB)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

// Максимальное количество файлов в кэше
const MAX_CACHE_ENTRIES = 100;

// Время жизни кэша (24 часа)
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

/**
 * Установка Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker версии:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Кэшируем статические ресурсы
        const cachePromises = STATIC_CACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (response.ok) {
              await cache.put(url, response);
              console.log('[SW] Закэширован:', url);
            } else {
              console.warn('[SW] Не удалось закэшировать:', url, response.status);
            }
          } catch (error) {
            console.warn('[SW] Ошибка кэширования:', url, error.message);
          }
        });
        
        await Promise.allSettled(cachePromises);
        
        // Принудительно активируем новый Service Worker
        self.skipWaiting();
        
        console.log('[SW] Установка завершена успешно');
      } catch (error) {
        console.error('[SW] Ошибка при установке:', error);
        throw error;
      }
    })()
  );
});

/**
 * Активация Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker версии:', CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // Получаем контроль над всеми клиентами
        await self.clients.claim();
        
        // Удаляем старые кэши
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletionPromises);
        
        // Очищаем кэш от устаревших файлов
        await cleanupCache();
        
        // Уведомляем всех клиентов об обновлении
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATE_AVAILABLE',
            payload: {
              version: CACHE_VERSION,
              timestamp: Date.now()
            }
          });
        });
        
        console.log('[SW] Активация завершена успешно');
      } catch (error) {
        console.error('[SW] Ошибка при активации:', error);
      }
    })()
  );
});

/**
 * Перехват запросов
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем запросы к другим доменам
  if (url.origin !== location.origin) {
    return;
  }
  
  // Игнорируем WebSocket соединения
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }
  
  // Определяем стратегию кэширования
  const strategy = getCacheStrategy(url.pathname, request.method);
  
  event.respondWith(handleRequest(request, strategy));
});

/**
 * Получение стратегии кэширования для URL
 */
function getCacheStrategy(pathname, method) {
  // Только GET запросы кэшируем
  if (method !== 'GET') {
    return 'network-only';
  }
  
  // Проверяем network-only URLs
  if (NETWORK_ONLY_URLS.some(pattern => pathname.includes(pattern))) {
    return 'network-only';
  }
  
  // API запросы - сначала сеть, потом кэш
  if (pathname.startsWith('/api/')) {
    return 'network-first';
  }
  
  // Проверяем runtime cache patterns для статических ресурсов
  if (shouldRuntimeCache(pathname)) {
    return 'cache-first';
  }
  
  // Статические ресурсы - сначала кэш, потом сеть
  if (pathname.startsWith('/assets/') || 
      pathname.includes('.js') || 
      pathname.includes('.css') ||
      pathname.includes('.png') ||
      pathname.includes('.jpg') ||
      pathname.includes('.svg') ||
      pathname.includes('.woff')) {
    return 'cache-first';
  }
  
  // HTML файлы - сначала сеть, потом кэш
  if (pathname === '/' || pathname.includes('.html')) {
    return 'network-first';
  }
  
  // По умолчанию - кэш первым
  return 'cache-first';
}

/**
 * Проверка, соответствует ли URL паттернам runtime кэша
 */
function shouldRuntimeCache(pathname) {
  return RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Обработка запроса в зависимости от стратегии
 */
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  switch (strategy) {
    case 'network-only':
      return handleNetworkOnly(request);
      
    case 'cache-only':
      return handleCacheOnly(request, cache);
      
    case 'network-first':
      return handleNetworkFirst(request, cache);
      
    case 'cache-first':
      return handleCacheFirst(request, cache);
      
    default:
      return handleCacheFirst(request, cache);
  }
}

/**
 * Стратегия: только сеть
 */
async function handleNetworkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.warn('[SW] Network-only запрос не удался:', request.url);
    return createErrorResponse('Сеть недоступна');
  }
}

/**
 * Стратегия: только кэш
 */
async function handleCacheOnly(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return createErrorResponse('Ресурс не найден в кэше');
}

/**
 * Стратегия: сначала сеть, потом кэш
 */
async function handleNetworkFirst(request, cache) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      // Кэшируем успешный ответ
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      await limitCacheSize(cache);
    }

    return response;
  } catch (error) {
    console.warn('[SW] Сеть недоступна, пробуем кэш:', request.url);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Если это HTML запрос, возвращаем index.html из кэша
    if (request.headers.get('Accept')?.includes('text/html')) {
      const cachedIndex = await cache.match('/index.html');
      if (cachedIndex) {
        return cachedIndex;
      }
      // Если нет index.html, только тогда offline-страница
      return createOfflineResponse();
    }

    return createErrorResponse('Ресурс недоступен');
  }
}

/**
 * Стратегия: сначала кэш, потом сеть
 */
async function handleCacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Проверяем, не устарел ли кэш
    const cachedDate = cachedResponse.headers.get('sw-cache-date');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      if (age > CACHE_EXPIRATION_TIME) {
        console.log('[SW] Кэш устарел, обновляем:', request.url);
        return handleNetworkFirst(request, cache);
      }
    }
    
    return cachedResponse;
  }
  
  // В кэше нет, пробуем сеть
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const responseClone = response.clone();
      
      // Добавляем timestamp к заголовкам
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', Date.now().toString());
      
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      await cache.put(request, responseWithTimestamp);
      await limitCacheSize(cache);
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Не удалось загрузить ресурс:', request.url);
    return createErrorResponse('Ресурс недоступен');
  }
}

/**
 * Ограничение размера кэша
 */
async function limitCacheSize(cache) {
  const keys = await cache.keys();
  
  if (keys.length > MAX_CACHE_ENTRIES) {
    // Удаляем самые старые записи
    const cacheEntries = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cachedDate = response.headers.get('sw-cache-date');
        const timestamp = cachedDate ? parseInt(cachedDate) : 0;
        cacheEntries.push({ request, timestamp });
      }
    }
    
    // Сортируем по времени (старые первыми)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    const entriesToDelete = cacheEntries.slice(0, keys.length - MAX_CACHE_ENTRIES);
    await Promise.all(entriesToDelete.map(entry => cache.delete(entry.request)));
    
    console.log('[SW] Удалено устаревших записей:', entriesToDelete.length);
  }
  
  // Проверяем общий размер кэша
  const totalSize = await calculateCacheSize(cache);
  if (totalSize > MAX_CACHE_SIZE) {
    console.log('[SW] Размер кэша превышен:', totalSize, 'байт, максимум:', MAX_CACHE_SIZE);
    await reduceCacheSize(cache, totalSize);
  }
}

/**
 * Подсчет размера кэша
 */
async function calculateCacheSize(cache) {
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        totalSize += parseInt(contentLength);
      } else {
        // Приблизительная оценка размера если content-length недоступен
        try {
          const blob = await response.blob();
          totalSize += blob.size;
        } catch {
          // Если не удается получить размер, считаем 1KB
          totalSize += 1024;
        }
      }
    }
  }
  
  return totalSize;
}

/**
 * Уменьшение размера кэша
 */
async function reduceCacheSize(cache, currentSize) {
  const keys = await cache.keys();
  const cacheEntries = [];
  
  // Собираем информацию о всех записях
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const cachedDate = response.headers.get('sw-cache-date');
      const timestamp = cachedDate ? parseInt(cachedDate) : 0;
      
      let size = 0;
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        size = parseInt(contentLength);
      } else {
        try {
          const blob = await response.blob();
          size = blob.size;
        } catch {
          size = 1024; // Примерный размер
        }
      }
      
      cacheEntries.push({ request, timestamp, size });
    }
  }
  
  // Сортируем по времени (старые первыми)
  cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
  
  // Удаляем записи пока размер не станет приемлемым
  let removedSize = 0;
  const targetReduction = currentSize - (MAX_CACHE_SIZE * 0.8); // Убираем до 80% от лимита
  
  for (const entry of cacheEntries) {
    if (removedSize >= targetReduction) break;
    
    await cache.delete(entry.request);
    removedSize += entry.size;
  }
  
  console.log('[SW] Освобождено места в кэше:', removedSize, 'байт');
}

/**
 * Очистка кэша от устаревших файлов
 */
async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const expiredKeys = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cachedDate = response.headers.get('sw-cache-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate);
          if (age > CACHE_EXPIRATION_TIME) {
            expiredKeys.push(request);
          }
        }
      }
    }
    
    if (expiredKeys.length > 0) {
      await Promise.all(expiredKeys.map(key => cache.delete(key)));
      console.log('[SW] Очищено устаревших записей:', expiredKeys.length);
    }
  } catch (error) {
    console.error('[SW] Ошибка при очистке кэша:', error);
  }
}

/**
 * Создание ответа об ошибке
 */
function createErrorResponse(message) {
  return new Response(
    JSON.stringify({
      error: true,
      message: message,
      timestamp: Date.now()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

/**
 * Создание офлайн страницы
 */
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chaos Organizer - Офлайн</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .offline-container {
          text-align: center;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .offline-title {
          font-size: 24px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .offline-message {
          font-size: 16px;
          margin-bottom: 30px;
          opacity: 0.9;
          line-height: 1.5;
        }
        .retry-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">Chaos Organizer</h1>
        <p class="offline-message">
          Вы находитесь в автономном режиме.<br>
          Проверьте подключение к интернету и попробуйте снова.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Попробовать снова
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Обработка сообщений от клиента
 */
self.addEventListener('message', (event) => {
  const { type } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Получен запрос на пропуск ожидания');
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        if (event.ports[0]) {
          event.ports[0].postMessage({
            type: 'CACHE_SIZE_RESPONSE',
            payload: { size }
          });
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCache().then(() => {
        if (event.ports[0]) {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: true }
          });
        }
      });
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        if (event.ports[0]) {
          event.ports[0].postMessage({
            type: 'CACHE_INFO_RESPONSE',
            payload: info
          });
        }
      });
      break;
      
    default:
      console.log('[SW] Неизвестное сообщение:', event.data);
  }
});

/**
 * Получение информации о кэше
 */
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const info = {
      totalCaches: cacheNames.length,
      currentCache: CACHE_NAME,
      totalSize: 0,
      totalEntries: 0,
      maxSize: MAX_CACHE_SIZE,
      caches: []
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      const cacheSize = await calculateCacheSize(cache);
      
      info.caches.push({
        name: cacheName,
        entries: keys.length,
        size: cacheSize,
        isCurrent: cacheName === CACHE_NAME
      });
      
      info.totalSize += cacheSize;
      info.totalEntries += keys.length;
    }
    
    return info;
  } catch (error) {
    console.error('[SW] Ошибка при получении информации о кэше:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

/**
 * Получение размера кэша (упрощенная версия)
 */
async function getCacheSize() {
  try {
    const info = await getCacheInfo();
    return info.totalSize || 0;
  } catch (error) {
    console.error('[SW] Ошибка при подсчете размера кэша:', error);
    return 0;
  }
}

/**
 * Очистка всего кэша
 */
async function clearAllCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('[SW] Весь кэш очищен');
  } catch (error) {
    console.error('[SW] Ошибка при очистке кэша:', error);
  }
}

/**
 * Обработка push уведомлений
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Получено push уведомление');
  
  const options = {
    body: 'У вас новое сообщение в Chaos Organizer',
    icon: '/chat-256x256.png',
    badge: '/badge-128x128.png',
    tag: 'chaos-organizer-message',
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть чат',
        icon: '/chat.png'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload };
    } catch (error) {
      console.warn('[SW] Не удалось распарсить данные push уведомления:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Chaos Organizer', options)
  );
});

/**
 * Обработка кликов по уведомлениям
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Открываем или фокусируем окно приложения
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Ищем уже открытое окно
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      
      // Открываем новое окно
      return self.clients.openWindow('/');
    })
  );
});

/**
 * Обработка фоновой синхронизации
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Выполнение фоновой синхронизации
 */
async function doBackgroundSync() {
  try {
    // Здесь можно выполнить отложенные операции
    // Например, отправить несохраненные сообщения
    console.log('[SW] Выполняется фоновая синхронизация');
    
    // Уведомляем клиентов о синхронизации
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        payload: { timestamp: Date.now() }
      });
    });
  } catch (error) {
    console.error('[SW] Ошибка при фоновой синхронизации:', error);
  }
}

// Логирование состояния Service Worker
console.log('[SW] Service Worker загружен, версия:', CACHE_VERSION);