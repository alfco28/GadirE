const CACHE_NAME = 'pwa-cache-v2';

const CACHE_GROUPS = {
  // Recursos necesarios para abrir y utilizar la aplicación sin conexión
  staticAssets: [
    '/',
    '/index.html',
    '/manifest.json',

    '/LICENSE',
    '/README.md',
    '/CONTRIBUTING.md',

    '/assets/logo_ceuca.webp',
    '/assets/logo_gadire.webp',

    '/config/global.json',
    '/config/univ.json',

    '/locales/es_es.json',
    '/locales/uk_en.json',

    '/data/map_data.geojson',
    '/data/agenda_publica_presidencia_CEUCA.ics',
    '/data/festivos_Espana.ics',
    '/data/notifications.xml',

    '/libraries/marked/marked.umd.min.js',
    '/libraries/fusejs/fuse.min.js',
    '/libraries/fullcalendar/index.global.min.js',
    '/libraries/fontawesome/css/all.min.css',
    '/libraries/fontawesome/webfonts/fa-brands-400.ttf',
    '/libraries/fontawesome/webfonts/fa-brands-400.woff2',
    '/libraries/fontawesome/webfonts/fa-regular-400.ttf',
    '/libraries/fontawesome/webfonts/fa-regular-400.woff2',
    '/libraries/fontawesome/webfonts/fa-solid-900.ttf',
    '/libraries/fontawesome/webfonts/fa-solid-900.woff2',
    '/libraries/fontawesome/webfonts/fa-v4compatibility.ttf',
    '/libraries/fontawesome/webfonts/fa-v4compatibility.woff2',
    '/libraries/jsbarcode/JsBarcode.all.min.js',
    '/libraries/icaljs/ical.min.js',

    '/libraries/leafletjs/leaflet.css',
    '/libraries/leafletjs/leaflet.js',
    '/libraries/leafletjs/images/layers-2x.png',
    '/libraries/leafletjs/images/layers.png',
    '/libraries/leafletjs/images/marker-icon-2x.png',
    '/libraries/leafletjs/images/marker-icon.png',
    '/libraries/leafletjs/images/marker-shadow.png',

    '/scripts/calendar/calendar.js',
    '/scripts/general/config.js',
    '/scripts/general/modal_window.js',
    '/scripts/general/translation.js',
    '/scripts/map/filters.js',
    '/scripts/map/map.js',
    '/scripts/map/sidebar.js',
    '/scripts/notifications/rss_reader.js',
    '/scripts/ui/home.js',
    '/scripts/ui/main.js',
    '/scripts/ui/sidebar.js',

    '/visuals/general/cookies.css',
    '/visuals/general/dark_mode.css',
    '/visuals/general/main.css',
    '/visuals/general/modal_window.css',
    '/visuals/general/responsive.css',
    '/visuals/specific/calendar.css',
    '/visuals/specific/home.css',
    '/visuals/specific/map.css',
    '/visuals/specific/notifications.css',
    '/visuals/specific/settings.css',
    '/visuals/specific/sidebar.css'
  ],

  // Datos que pueden actualizarse, pero deben estar disponibles sin conexión
  dynamicAssets: [
    //'/data/map_data.geojson',
    //'/data/agenda_publica_presidencia_CEUCA.ics',
    //'/data/festivos_Espana.ics',
    //'/data/notifications.xml'
  ]
};

// Instalación: guarda los archivos estáticos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_GROUPS.staticAssets))
      .then(() => self.skipWaiting())
  );
});

// Estrategias de caché
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const pathname = requestUrl.pathname;
  const isStaticAsset = CACHE_GROUPS.staticAssets.includes(pathname);
  const isDynamicAsset = CACHE_GROUPS.dynamicAssets.includes(pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request);
        })
    );

    return;
  }

  if (isDynamicAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache));

          return response;
        })
        .catch(() => caches.match(event.request))
    );

    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
  }
});

// Actualización del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});