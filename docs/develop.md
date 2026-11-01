# Development guide

## Architecture

GadirE is a frontend application with no backend of its own. `index.html` contains the structure of the screens and loads the libraries, the scripts and the style sheets. The browser fetches the data with `fetch`, runs the logic and saves the preferences in `localStorage`.

## Boot flow

1. The browser loads `index.html`.
2. Leaflet, Fuse.js, Font Awesome and FullCalendar load (all vendored locally under `/libraries/`).
3. `scripts/general/config.js` registers the service worker, loads the preferences and wires the settings controls.
4. `scripts/ui/main.js` drives the dock and the full-screen views.
5. `scripts/ui/home.js` loads `config/univ.json` and builds the tiles.
6. `scripts/map/map.js` downloads the GeoJSON, builds the indexes, initialises Leaflet and renders the markers.
7. `scripts/calendar/calendar.js` generates the selectors and loads the ICS events.
8. `scripts/notifications/rss_reader.js` generates the selectors and queries the RSS feeds.
9. `scripts/general/translation.js` loads the saved language.

## Modules

- `scripts/map/map.js`: Leaflet map, markers, popups, search, geolocation and sharing.
- `scripts/map/filters.js`: wiring of the four filter selectors to the map state.
- `scripts/map/sidebar.js`: grouping of places by building and floor.
- `scripts/ui/main.js`: switching between map, home, calendar, notifications and settings.
- `scripts/ui/sidebar.js`: opening and closing the sidebar.
- `scripts/ui/home.js`: rendering of the tiles, the personal-data card and loading of its HTML views.
- `scripts/calendar/calendar.js`: reading of ICS and rendering with FullCalendar.
- `scripts/notifications/rss_reader.js`: selection, querying and ordering of the RSS feeds.
- `scripts/general/config.js`: preferences, accessibility, customisation and personal data.
- `scripts/general/translation.js`: loading of the translations by HTML identifier.
- `scripts/general/modal_window.js`: the shared modal window.

## Map search

The GeoJSON is indexed by campus, building, floor and type. A token index and a fuzzy Fuse.js index are built on top. The search combines exact and approximate matches and then applies the active filters.

The markers are grouped in layers by type. Updating the filters does not recreate the markers: it only adds or removes each layer from the map.

## Local persistence

The current `localStorage` keys are:

- `gadire_state`: general preferences.
- `personal_data`: name, surnames, centre, campus, compressed photo, barcode and related preferences.
- `calendarSelections`: calendar selection.
- `feedSelections`: feed selection.

There is no synchronisation between devices and no user account.

## Dependencies

All the libraries are vendored in the repository under `/libraries/` (no CDN):

- Leaflet for the map, plus Leaflet.markercluster for marker clustering.
- OpenStreetMap for the current basemap tiles (the only external map source).
- Fuse.js for fuzzy search.
- FullCalendar for the calendar view.
- `ical.js` to parse ICS.
- JsBarcode to render barcodes.
- Font Awesome for the icons (its web fonts ship locally).
- `marked` for Markdown rendering in tile pages.
- `rss2json.com` as the external RSS proxy (the only third-party service called at runtime besides the map tiles and the configured feeds).

Vendoring means the app loads everything from its own origin: no CDN outages or remote tracking. Keep the vendored copies in sync with their upstream releases and record the version in the folder name or in `sw.js` when upgrading.

## Service worker

`sw.js` uses two resource groups:

- `staticAssets`: preloaded during installation and served from cache first — the app shell, the vendored libraries and the HTML pages of the home tiles (`univ/menu.html`, `univ/agenda.html` and their script).
- `dynamicAssets`: tries the network first, stores the response and uses the cache if the connection fails — currently the map GeoJSON, the ICS calendars and the notifications XML.

The cache name is versioned (`CACHE_NAME` in `sw.js`). Resources not declared in those groups are not cached automatically; offline navigations not found fall back to `/index.html`. When adding a new tile page or a new resource that must work offline, add it to `staticAssets` together with everything it loads.

## Modification conventions

- Keep the identifiers of `index.html` compatible with the scripts and the translations.
- Escape or insert text through safe APIs where appropriate.
- Do not introduce paths that only work in the local environment.
- Keep the HTML and JavaScript specific to the home tiles in `univ/`, serve them from the same origin and declare a `<title>` in every document.
- The HTML views load in iframes; the loader syncs the font, the colour variables and the `html.dark` class. A page can request a typographic exception with `font-family: ... !important`.
- Update `sw.js` when a resource that must be cached is added.
- Keep the attribution and the licences of the dependencies.
- Test the modified module first, then the whole flow.

## Known limitations

There are options wired to the interface that currently only store their value or log console messages: basemap, zoom, initial page, push notifications, notification filters and import/export. Before documenting them as available functionality, their `apply...` functions and their user flow must be completed.