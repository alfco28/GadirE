# Home tiles configuration

The home-screen tiles are configured from `config/univ.json`, inside the `homeTiles` property.

## Configuration for administrators

Every tile accepts the following fields:
   Field | Required | Description |
 |---|---|---|
 | `id` | Yes | Identifier of the tile in `index.html`. |
 | `image` | No | Path of an image (preferably kept inside `assets`). |
 | `icon` | No | Font Awesome icon classes. |
 | `text` | Yes | Text shown under the image or icon. |
 | `alt` | Recommended | Alternative text for accessibility. |
 | `url` | No | Address the tile navigates to. |
 | `openAs` | No | How the HTML opens: `modal` or `fullscreen`. |
 | `html` | No | Absolute path to the HTML document, e.g. `/univ/menu.html`. |

`image` and `icon` are mutually exclusive: only one of the two must be configured (the other must be `null`).
For `tile-0`, the application reserves the content for the user's local personal data. For the other tiles, `openAs` together with `html` opens a custom document; if not configured, `url` keeps the current navigation.

## Custom HTML and JavaScript

Keep the tiles' HTML documents and their scripts in `univ/`. It is good practice because every university can keep its own contents there, separated from the shared resources of `assets/`.

Every HTML must be a complete document and include a `<title>`, which is used in the modal header or the `title-bar` for fullscreen. Local scripts can be loaded with paths relative to the document, for example `<script defer src="./menu.js"></script>`. For GadirE to read the title and sync the theme, the files must be served from the same origin as the application.

The views load in an `iframe`, so their JavaScript runs as in a normal document. The loader applies the GadirE font, shares the tokens `--color-enfasis`, `--color-fondo-primario`, `--color-texto-primario` and `--color-texto-secundario`, and copies the dark state as the `html.dark` class. A custom rule with `font-family: ... !important` can define an exception. To take advantage of the theme, use the CSS variables, for example `color: var(--color-texto-primario)` or `background: var(--color-enfasis)`.

The test entries in `config/univ.json` point to these two views:

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

To try them, open Home and press the corresponding tile. The menu shows or hides a list and the agenda changes day. Both display the mode, the font and the accent they received, plus a typographic line marked with `!important`.

The HTML and scripts run active code: configure only your own, trusted files. The current `univ/` pages (`menu.html`, `agenda.html` and `menu.js`) are already part of the service worker's `staticAssets`, so they work offline; a new tile page must be added to `staticAssets` in `sw.js` together with the resources it loads, or it will need a connection.

Example:

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
```