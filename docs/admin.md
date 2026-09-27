# Guía de administración

GadirE no tiene panel de administración. La administración consiste en editar los archivos de datos y configuración, validarlos y publicar la nueva versión.

## Archivos administrables

| Archivo | Uso |
|---|---|
| `config/univ.json` | Tiles de inicio, calendarios y feeds RSS. |
| `data/map_data.geojson` | Espacios y coordenadas del mapa. |
| `data/*.ics` | Calendarios locales en formato iCalendar. |
| `locales/es_es.json` | Textos en español. |
| `locales/uk_en.json` | Textos en inglés. |
| `assets/*` | Imágenes usadas por la interfaz o las tiles. |
| `univ/*` | HTML y JavaScript propios de las home tiles de cada universidad. |

`config/global.json` existe, pero está vacío en la versión actual y no participa en la configuración efectiva.

## Actualizar las tiles

Las tiles se definen en `config/univ.json`, dentro de `homeTiles`. Cada entrada debe usar un `id` existente entre `tile-0` y `tile-17`.

Campos:

- `id`: obligatorio y único.
- `image`: ruta de una imagen o `null`.
- `icon`: clases de Font Awesome o `null`.
- `text`: texto visible.
- `alt`: texto alternativo.
- `url`: destino externo opcional.
- `openAs`: `modal` o `fullscreen` para abrir un HTML propio.
- `html`: ruta absoluta al HTML, por ejemplo `/univ/menu.html`.

`image` e `icon` son alternativas. Para `tile-0`, la aplicación reserva el contenido para los datos personales locales del usuario. En las demás tiles, configura `openAs` y `html` para una vista propia; si no están definidos, `url` mantiene la navegación existente.

Guarda las páginas y sus scripts particulares en `univ/`, no en `assets/`, para mantener separados los contenidos específicos de cada universidad. Cada página debe ser un documento HTML completo con `<title>` y puede incluir scripts relativos, como `./menu.js`. Sirve estos archivos desde el mismo origen y configura solo código de confianza. Consulta [home.md](home.md) para ver ejemplos configurados y cómo probarlos.

Consulta también [home.md](home.md).

## Actualizar el mapa

Edite `data/map_data.geojson` respetando el formato `FeatureCollection`. Cada espacio debe ser un `Feature` con geometría `Point` y propiedades al menos equivalentes a:

```json
{
  "clase": "espacio",
  "nombre": "Nombre visible",
  "descrip": "Descripción opcional",
  "enlace": "",
  "tipo": "aula",
  "planta": "baja",
  "edificio": "Edificio de ejemplo",
  "campus": "Cádiz",
  "idnum": "identificador-unico"
}
```

El identificador `idnum` debe ser único porque se usa para buscar, compartir y abrir marcadores mediante el hash de la URL. Las coordenadas GeoJSON deben estar en el orden `[longitud, latitud]`.

Después de modificar el archivo, compruebe que los filtros, el buscador, el popup y el enlace compartido funcionan.

## Añadir calendarios

Dentro de `calendars.byTheme`, añada un objeto con:

- `id`: identificador único del checkbox.
- `name`: nombre visible.
- `path`: ruta local o URL accesible al archivo ICS.
- `checked`: selección inicial.

Los archivos locales se guardan normalmente en `data/`. El calendario se descarga desde el navegador y se interpreta mediante `ical.js`.

## Añadir feeds

Dentro de `feeds.byTheme`, añada:

- `id`: identificador único.
- `name`: nombre visible.
- `url`: URL del feed RSS.
- `checked`: selección inicial.

El feed debe ser público y compatible con el servicio externo `rss2json.com`. Si una fuente deja de funcionar, desactívela o sustitúyala para evitar errores en la pantalla de noticias.

## Traducciones

Los identificadores de los elementos traducibles de `index.html` deben existir como claves en ambos archivos de idioma. Al añadir una etiqueta nueva, incorpore la misma clave en español e inglés.

## Procedimiento recomendado

1. Hacer una copia de los archivos antes de editarlos.
2. Modificar una fuente de datos cada vez.
3. Validar JSON y GeoJSON.
4. Probar la aplicación en escritorio y móvil.
5. Revisar consola, mapa, filtros, calendario y noticias.
6. Publicar los cambios y comprobar la caché del navegador.
7. Registrar la fecha y el contenido de la actualización.
