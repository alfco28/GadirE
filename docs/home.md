## Configuración de las tiles de inicio

Las tiles de la pantalla de inicio se configuran desde `config/univ.json`, dentro de la propiedad `homeTiles`.

### Configuración para administradores

Cada tile admite los siguientes campos:

| Campo | Obligatorio | Descripción |
|---|---:|---|
| `id` | Sí | Identificador de la tile en `index.html`. |
| `image` | No | Ruta de una imagen (es deseable que se guarden dentro de `assets`). |
| `icon` | No | Clases del icono de Font Awesome. |
| `text` | Sí | Texto mostrado debajo de la imagen o icono. |
| `alt` | Recomendado | Texto alternativo para accesibilidad. |
| `url` | No | Dirección a la que se navega al pulsar la tile. |
| `openAs` | No | Tipo de apertura del HTML: `modal` o `fullscreen`. |
| `html` | No | Ruta absoluta al documento HTML, por ejemplo `/univ/menu.html`. |

`image` e `icon` son excluyentes: debe configurarse únicamente una de las dos (la otra debe ser `null`).
Para `tile-0`, la aplicación reserva el contenido para los datos personales locales del usuario. En las demás tiles, `openAs` junto con `html` abre un documento propio; si no se configura, `url` conserva la navegación actual.

### HTML y JavaScript propios

Guarda los documentos HTML de las tiles y sus scripts en `univ/`. Es una buena práctica porque cada universidad puede mantener allí sus propios contenidos, separados de los recursos compartidos de `assets/`.

Cada HTML debe ser un documento completo e incluir `<title>`, que se utiliza en el encabezado de la modal o en `title-bar` para fullscreen. Los scripts locales pueden cargarse con rutas relativas al documento, por ejemplo `<script defer src="./menu.js"></script>`. Para que GadirE pueda leer el título y sincronizar el tema, los archivos deben servirse desde el mismo origen que la aplicación.

Las vistas se cargan en un `iframe`, por lo que su JavaScript se ejecuta como en un documento normal. El cargador aplica la fuente de GadirE, comparte los tokens `--color-enfasis`, `--color-fondo-primario`, `--color-texto-primario` y `--color-texto-secundario`, y copia el estado oscuro como clase `html.dark`. Una regla propia con `font-family: ... !important` puede definir una excepción. Para aprovechar el tema, usa las variables CSS, por ejemplo `color: var(--color-texto-primario)` o `background: var(--color-enfasis)`.

Las entradas de prueba que hay en `config/univ.json` apuntan a estas dos vistas:

```json
{
  "id": "tile-5",
  "image": null,
  "icon": "fa-solid fa-utensils",
  "text": "Menú Cafetería",
  "alt": "Menú Cafetería",
  "openAs": "modal",
  "html": "/univ/menu.html"
}
```

```json
{
  "id": "tile-6",
  "image": null,
  "icon": "fa-solid fa-calendar",
  "text": "Agenda",
  "alt": "Agenda",
  "openAs": "fullscreen",
  "html": "/univ/agenda.html"
}
```

Para probarlas, abre Inicio y pulsa la tile correspondiente. El menú permite mostrar u ocultar una lista y la agenda cambia de día. Ambas muestran el modo, la fuente y el acento recibidos, además de una línea tipográfica marcada con `!important`.

Los HTML y scripts ejecutan código activo: configura únicamente archivos propios y de confianza. Los recursos de `univ/` no están incluidos actualmente en la caché estática del service worker; para usarlos sin conexión, incorpóralos a `staticAssets` en `sw.js` junto con los recursos que carguen.

Ejemplo:

```json
{
  "homeTiles": [
    {
      "id": "tile-2",
      "image": null,
      "icon": "fa-solid fa-image",
      "text": "Texto visible 1",
      "alt": "Texto alternativo 1",
      "url": "https://ciencias.uca.es"
    },
    {
      "id": "tile-3",
      "image": "/assets/logo_ceuca.webp",
      "icon": null,
      "text": "Texto visible 2",
      "alt": "Texto alternativo 2",
      "url": "https://www.uca.es"
    }
  ]
}