# Despliegue y mantenimiento

## Requisitos

GadirE puede publicarse en cualquier servidor de archivos estáticos que sirva correctamente HTML, JavaScript, CSS, JSON, GeoJSON, ICS, XML e imágenes.

Se recomienda HTTPS porque:

- los navegadores restringen la geolocalización en contextos no seguros;
- el service worker requiere un contexto seguro, salvo localhost;
- las fuentes externas y los navegadores modernos funcionan mejor sin contenido mixto.

## Publicación

1. Copie el contenido del proyecto al directorio público del servidor.
2. Mantenga las rutas absolutas usadas por la aplicación, como `/data/map_data.geojson` y `/config/univ.json`.
3. Compruebe que `index.html`, `manifest.json` y `sw.js` están disponibles desde la raíz esperada.
4. Verifique que el servidor devuelve los tipos MIME adecuados.
5. Abra la aplicación y revise la consola del navegador.

La aplicación no necesita un proceso de compilación ni un gestor de paquetes para la estructura actual.

## Service worker y caché

El service worker usa el nombre de caché `pwa-cache-v2`. Precarga los recursos declarados en `staticAssets` y los sirve primero desde caché; `dynamicAssets` usa la red primero con recuperación desde caché, aunque actualmente no contiene recursos activos. Los recursos no declarados no se guardan automáticamente.

Después de modificar JavaScript, CSS, configuración o datos:

1. publique los archivos;
2. actualice el nombre de caché si el navegador conserva contenido antiguo;
3. recargue con las herramientas de desarrollador o borre los datos del sitio;
4. vuelva a comprobar una instalación PWA existente.

## Lista de comprobación

- El manifest carga iconos y muestra el nombre de GadirE.
- El mapa base de OpenStreetMap aparece con su atribución.
- Los marcadores se cargan desde el GeoJSON.
- Buscar y filtrar actualizan mapa y barra lateral.
- Un marcador compartido mediante hash abre el lugar correcto.
- La geolocalización solicita permiso y muestra una posición cuando se autoriza.
- Las tiles de inicio cargan sus imágenes, iconos y enlaces.
- Las tiles HTML cargan el título y ejecutan sus scripts en modal y fullscreen; prueba los controles interactivos del menú y la agenda.
- Comprueba en esas vistas la fuente, el modo oscuro, el color de acento y la excepción con `!important`.
- Los calendarios ICS se muestran sin errores.
- Los feeds RSS cargan o muestran un estado tolerable si una fuente falla.
- El cambio de idioma actualiza los textos disponibles.
- El modo oscuro y las opciones de accesibilidad se conservan tras recargar.
- La aplicación funciona en móvil y escritorio.

## Problemas frecuentes

### El mapa aparece vacío

Compruebe la ruta de `data/map_data.geojson`, el formato GeoJSON y los errores de red o JavaScript. También confirme que cada tipo de feature tiene una capa reconocida.

### No aparecen noticias

Compruebe la URL RSS, la respuesta de `rss2json.com`, la selección guardada en `feedSelections` y las restricciones de red del navegador.

### No aparece un calendario

Compruebe que la ruta ICS es accesible, que el contenido es válido y que el checkbox está seleccionado. Revise la consola para errores del parser.

### Se muestra una versión antigua

El navegador puede estar usando el service worker o una respuesta cacheada. Incremente `CACHE_NAME`, desregistre el service worker durante la prueba o borre los datos del sitio.

### Una home tile HTML no está disponible sin conexión

Incluye los documentos de `/univ/` en `staticAssets` de `sw.js` y añade también sus scripts, hojas de estilo e imágenes dependientes. Actualmente, las páginas de ejemplo de `univ/` no forman parte de esa lista.

### La geolocalización falla

Compruebe permisos del navegador, HTTPS, disponibilidad del dispositivo y configuración del sistema operativo.
