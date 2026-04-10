// service-worker.js
const CACHE_NAME = 'pwa-cache-v1';
const CACHE_GROUPS = {
  // Archivos estáticos (Cache First)
  staticAssets: [
    
  ],
  // Archivos dinámicos (Network First)
  dynamicAssets: [
    'data/map_data.geojson',
    '/data/agenda_publica_presidencia_CEUCA.ics',
    '/data/festivos_Espana.ics',
    'data/notifications.xml'
  ],
  // Archivos que pueden estar desactualizados temporalmente (Stale-While-Revalidate)
  staleAssets: [
    'index.html',
    'manifest.json',
    'assets/logo_ceuca.webp',
    'assets/logo_gadire.webp',
    'config/global.json',
    'config/univ.json',
    'libraries/fullcalendar/index.global.min.js',
    'libraries/fusejs/fuse.min.js',
    'libraries/leafletjs/leaflet.css',
    'libraries/leafletjs/leaflet.js',
    'libraries/leafletjs/images/layers-2x.png',
    'libraries/leafletjs/images/layers.png',
    'libraries/leafletjs/images/marker-icon-2x.png',
    'libraries/leafletjs/images/marker-icon.png',
    'libraries/leafletjs/images/marker-shadow.png',
    'locales/es_es.json',
    'locales/uk_en.json',
    'scripts/calendar/calendar.js',
    'scripts/general/config.js',
    'scripts/general/modal_window.js',
    'scripts/general/translation.js',
    'scripts/map/filters.js',
    'scripts/map/map.js',
    'scripts/map/sidebar.js',
    'scripts/notifications/rss_reader.js',
    'scripts/ui/main.js',
    'scripts/ui/sidebar.js',
    'visuals/general/cookies.css',
    'visuals/general/dark_mode.css',
    'visuals/general/main.css',
    'visuals/general/modal_window.css',
    'visuals/general/responsive.css',
    'visuals/specific/calendar.css',
    'visuals/specific/home.css',
    'visuals/specific/map.css',
    'visuals/specific/notifications.css',
    'visuals/specific/settings.css',
    'visuals/specific/sidebar.css'
  ],
};

// Instalación: guarda los archivos estáticos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_GROUPS.staticAssets))
  );
});

// Estrategias de caché
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache First para archivos estáticos
  if (CACHE_GROUPS.staticAssets.some((path) => url.pathname === path || url.pathname.startsWith(path))) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') return response;
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache));
              return response;
            });
        })
    );
  }
  // Network First para archivos dinámicos
  else if (CACHE_GROUPS.dynamicAssets.some((path) => url.pathname === path || url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
  // Stale-While-Revalidate para archivos tolerantes a desactualización
  else if (CACHE_GROUPS.staleAssets.some((path) => url.pathname === path || url.pathname.startsWith(path))) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') return response;
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache));
              return response;
            });
          return cachedResponse || fetchPromise;
        })
    );
  }
  // Default: Network First para el resto
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
});

// Actualización del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) return caches.delete(cache);
          })
        );
      })
  );
});