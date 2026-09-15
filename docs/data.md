# Modelo de datos

## GeoJSON del mapa

El archivo `data/map_data.geojson` debe ser un `FeatureCollection`. Cada feature representa un espacio o punto de interés.

### Geometría

La geometría esperada es:

```json
{
  "type": "Point",
  "coordinates": [longitud, latitud]
}
```

Leaflet recibe las coordenadas invertidas como `[latitud, longitud]` al crear cada marcador.

### Propiedades

| Campo | Uso |
|---|---|
| `clase` | Clasificación general del registro. |
| `nombre` | Nombre mostrado en el popup y la búsqueda. |
| `descrip` | Descripción opcional. |
| `enlace` | Campo reservado para un enlace asociado. |
| `tipo` | Determina el filtro y el color del marcador. |
| `planta` | Planta mostrada en filtros y listados. |
| `edificio` | Edificio del espacio. |
| `campus` | Campus del espacio. |
| `idnum` | Identificador único para compartir y localizar el marcador. |

### Tipos usados

Los tipos reconocidos por el mapa son `descanso`, `aseo`, `aula`, `biblio`, `cafete`, `despacho`, `lab`, `repre`, `salon`, `transporte` y `unidad`. El tipo `emergencia` aparece en los datos y en el selector HTML, pero no tiene una capa de marcadores propia en `map.js`; debe revisarse si se incorporan registros de ese tipo.

Los valores de campus y edificio deben coincidir exactamente con los usados en los selectores de `index.html` para que el filtrado resulte intuitivo.

## Configuración institucional

`config/univ.json` contiene tres bloques principales:

- `homeTiles`: accesos rápidos de la pantalla de inicio.
- `calendars.byTheme`: calendarios agrupados por temática.
- `feeds.byTheme`: feeds RSS agrupados por temática.

El campo `checked` establece la selección inicial, pero el navegador puede sobrescribirla con las selecciones guardadas localmente.

## Calendarios ICS

Los calendarios pueden ser locales o remotos. Cada evento ICS puede proporcionar:

- resumen o título;
- fecha y hora de inicio;
- fecha y hora de fin;
- indicador de evento de día completo;
- ubicación;
- descripción;
- identificador único.

GadirE transforma estos datos al formato esperado por FullCalendar.

## Feeds RSS

Cada feed necesita una URL pública. El servicio `rss2json.com` devuelve la información del canal y sus entradas. La aplicación usa principalmente título, enlace, fecha de publicación, descripción, imagen y nombre de la fuente.

Las entradas de todos los feeds seleccionados se mezclan y ordenan por fecha descendente.

## Validación mínima

Antes de publicar datos nuevos, compruebe:

- JSON correctamente formado.
- GeoJSON válido y con coordenadas numéricas.
- `idnum` sin duplicados.
- URLs accesibles mediante HTTPS cuando sea posible.
- rutas de imágenes existentes.
- claves de traducción presentes en ambos idiomas.
