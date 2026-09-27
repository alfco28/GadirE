# Guía de desarrollo

## Arquitectura

GadirE es una aplicación frontend sin backend propio. `index.html` contiene la estructura de las pantallas y carga las bibliotecas, los scripts y las hojas de estilo. El navegador obtiene los datos mediante `fetch`, ejecuta la lógica y guarda preferencias en `localStorage`.

## Flujo de arranque

1. El navegador carga `index.html`.
2. Se cargan Leaflet, Fuse.js, Font Awesome y FullCalendar.
3. `scripts/general/config.js` registra el service worker, carga preferencias y conecta los controles de configuración.
4. `scripts/ui/main.js` controla el dock y las pantallas completas.
5. `scripts/ui/home.js` carga `config/univ.json` y construye las tiles.
6. `scripts/map/map.js` descarga el GeoJSON, crea índices, inicializa Leaflet y renderiza marcadores.
7. `scripts/calendar/calendar.js` genera los selectores y carga eventos ICS.
8. `scripts/notifications/rss_reader.js` genera los selectores y consulta los feeds RSS.
9. `scripts/general/translation.js` carga el idioma guardado.

## Módulos

- `scripts/map/map.js`: mapa Leaflet, marcadores, popups, búsqueda, geolocalización y compartir.
- `scripts/map/filters.js`: conexión de los cuatro selectores de filtro con el estado del mapa.
- `scripts/map/sidebar.js`: agrupación de espacios por edificio y planta.
- `scripts/ui/main.js`: cambio entre mapa, inicio, calendario, noticias y configuración.
- `scripts/ui/sidebar.js`: apertura y cierre de la barra lateral.
- `scripts/ui/home.js`: renderizado de tiles, tarjeta de datos personales y carga de sus vistas HTML.
- `scripts/calendar/calendar.js`: lectura de ICS y renderizado mediante FullCalendar.
- `scripts/notifications/rss_reader.js`: selección, consulta y ordenación de feeds RSS.
- `scripts/general/config.js`: preferencias, accesibilidad, personalización y datos personales.
- `scripts/general/translation.js`: carga de traducciones por identificador HTML.
- `scripts/general/modal_window.js`: ventana modal compartida.

## Búsqueda del mapa

El GeoJSON se indexa por campus, edificio, planta y tipo. Además se construye un índice de tokens y un índice difuso de Fuse.js. La búsqueda combina coincidencias exactas y aproximadas y después aplica los filtros activos.

Los marcadores se agrupan en capas por tipo. Actualizar filtros no recrea los marcadores: únicamente añade o elimina cada capa del mapa.

## Persistencia local

Las claves actuales de `localStorage` son:

- `gadire_state`: preferencias generales.
- `personal_data`: nombre, apellidos, centro, campus, foto comprimida, código de barras y preferencias relacionadas.
- `calendarSelections`: selección de calendarios.
- `feedSelections`: selección de feeds.

No existe sincronización entre dispositivos ni una cuenta de usuario.

## Dependencias

- Leaflet para el mapa.
- OpenStreetMap para las teselas actuales.
- Fuse.js para búsqueda aproximada.
- FullCalendar para la vista de calendario.
- `ical.js` cargado desde CDN para analizar ICS.
- JsBarcode cargado desde CDN para representar códigos de barras.
- Font Awesome cargado desde CDN para iconos.
- `rss2json.com` como proxy de feeds RSS.

## Service worker

El `sw.js` utiliza dos grupos de recursos:

- `staticAssets`: se precarga durante la instalación y se sirve primero desde caché.
- `dynamicAssets`: intenta la red primero, guarda la respuesta y usa la caché si falla la conexión; actualmente no tiene recursos activos.

El nombre de caché actual es `pwa-cache-v2`. Los recursos que no estén declarados en esos grupos no se cachean automáticamente; las navegaciones offline no encontradas recurren a `/index.html`. Añade a `staticAssets` los HTML de tiles de `univ/` y sus dependencias si deben estar disponibles sin conexión.

## Convenciones de modificación

- Mantener los identificadores de `index.html` compatibles con scripts y traducciones.
- Escapar o insertar texto mediante APIs seguras cuando proceda.
- No introducir rutas que solo funcionen en el entorno local.
- Guardar el HTML y JavaScript específicos de las home tiles en `univ/`, servirlos desde el mismo origen y declarar un `<title>` en cada documento.
- Las vistas HTML se cargan en iframes; el cargador sincroniza fuente, variables de color y la clase `html.dark`. Las páginas pueden pedir una excepción tipográfica con `font-family: ... !important`.
- Actualizar `sw.js` cuando se incorporen recursos que deban cachearse.
- Mantener la atribución y las licencias de las dependencias.
- Probar primero el módulo modificado y después el flujo completo.

## Limitaciones conocidas

Hay opciones conectadas a la interfaz que actualmente solo guardan su valor o muestran mensajes de consola: mapa base, zoom, página inicial, notificaciones push, filtros de notificaciones e importación/exportación. Antes de documentarlas como funcionalidad disponible, deben completarse sus funciones `apply...` y su flujo de usuario.
