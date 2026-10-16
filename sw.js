const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/visuals.css',
    'map.js',
    'manifest.json',
    '/js_modules/sidebar.js',
    '/js_modules/filters.js',
    '/assets/logo_ceucatlas.webp',
    '/assets/logo_ceuca.webp'
];

// Evento install: cachea solo los recursos estáticos (excluyendo map_data.geojson)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Evento fetch: implementa estrategias diferentes para map_data.geojson y el resto de recursos
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Estrategia network-first para map_data.geojson
    if (url.pathname.endsWith('map_data.geojson')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Si la red funciona, actualiza la caché con los datos más recientes
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si falla la red, devuelve la versión cacheada (si existe)
                    return caches.match(event.request);
                })
        );
    }
    // Estrategia stale-while-revalidate para el resto de recursos estáticos
    else {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);
                return cachedResponse || fetchPromise;
            })
        );
    }
});

// Evento activate: limpia caches antiguas
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
