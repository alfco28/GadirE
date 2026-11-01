# Deployment and maintenance

## Requirements

GadirE can be published on any static file server that correctly serves HTML, JavaScript, CSS, JSON, GeoJSON, ICS, XML and images.

HTTPS is recommended because:

- browsers restrict geolocation in non-secure contexts;
- the service worker requires a secure context, except on localhost;
- external resources and modern browsers work best without mixed content.

## The deployment tool (`deploy.py`)

The repository carries a deployment tool, `deploy.py`, which automates the publication and removes the mistakes of the manual process. It is the recommended way to deploy.

### Private configuration (`deploy_config.json`)

The tool reads its private details (SSH host and user, port, staging folder and web root) from `deploy_config.json`, placed next to it:

```bash
cp deploy_config.example.json deploy_config.json   # then fill in your own values
```

`deploy_config.json` is **gitignored and must stay so**: it contains the host, the user and the paths of the server, which are private. Only `deploy_config.example.json` (with placeholder values) is public in the repository.

### What a deploy does

```bash
python3 deploy.py
```

1. **Refuses to deploy uncommitted or unpushed code.** A deploy must always be reproducible from the repository: uncommitted work cannot be rolled back on the server and unpushed work is not backed up anywhere.
2. **Rsyncs the working tree to a staging folder on the server**, deliberately excluding:
   - `data/` — the served data folder: the production `map_data.geojson` and the ICS are produced by the backend's crons and must never be clobbered by the repository copies;
   - `deploy_config.json` — the private configuration (host, user, paths);
   - `deploy_logs/` — the tool's own logs: they are full of private details and must never reach the web;
   - `deploy.py` and `deploy_config.example.json` — development tooling, not web files;
   - the junk (`.git`, `.DS_Store`).
3. **Cleans the staging leftovers** (an old `data/` clone, deploy files from older deployments, stray `.DS_Store`), so the copy step can never reach production data or publish dev files.
4. **Copies the staging folder over the web root** with `sudo` (it asks for the password once) and sweeps any `.DS_Store` left there by older manual copies.
5. **Verifies what the web actually serves**: the version badge in the served `index.html` must match the version just deployed, and the production GeoJSON must not have moved (same size and modification time before and after). If either check fails, the deploy stops with a clear error instead of failing silently.

A `--dry-run` prints every remote command it would run, executes nothing, works offline and records nothing (not even a log file):

```bash
python3 deploy.py --dry-run
```

### Logging

Every real deploy records each step in `deploy_logs/` (gitignored): one file per deploy, kept forever, plus `ultimo.log` with the latest one (for `tail -f`) — the same convention as the backend's logs. Because the logs contain the host, user and paths, they are excluded from the rsync and never published.

### Notes on permissions

The copy into the web root needs `sudo` on most servers; the tool asks for the password once during the `ssh -t` step. The staging folder must belong to the SSH user. Nothing else needs root.

## Service worker and cache

The service worker uses a versioned cache name (`CACHE_NAME` in `sw.js`, currently `pwa-cache-vN`). It splits the resources in two groups:

- `staticAssets`: preloaded during installation and served from cache first — the shell of the app, the vendored libraries and the HTML pages of the home tiles (`univ/`).
- `dynamicAssets`: network-first with cache fallback — the data that can change but must stay available offline: the map GeoJSON, the ICS calendars and the notifications XML.

Resources not declared in those groups are not cached automatically.

After modifying JavaScript, CSS, configuration or data:

1. deploy the files;
2. bump `CACHE_NAME` if the browsers must drop the old cache;
3. reload with the developer tools, or clear the site data;
4. check an existing PWA installation again.

Note for visitors: the first visit to a new version is served from cache (stale-while-revalidate), so the new version shows up on the **second** visit (or after clearing site data).

## Checklist

- The manifest loads its icons and shows the name of GadirE.
- The OpenStreetMap basemap appears with its attribution.
- The markers load from the GeoJSON.
- Search and filters update the map and the sidebar.
- A marker shared through a hash opens the right place.
- Geolocation asks for permission and shows a position when granted.
- The home tiles load their images, icons and links.
- The HTML tiles load the title and run their scripts in modal and fullscreen; test the interactive controls of the menu and the agenda.
- In those views, check the font, the dark mode, the accent colour and the `!important` exception.
- The ICS calendars render without errors.
- The RSS feeds load, or show a tolerable status if one fails.
- The language switch updates the available texts.
- The dark mode and the accessibility options survive a reload.
- The app works on mobile and desktop.
- After a deploy: the version badge of the served `index.html` matches, and the production `map_data.geojson` kept its size and modification time.

## Common problems

### The map appears empty

Check the path of `data/map_data.geojson`, the GeoJSON format and any network or JavaScript errors. Also confirm that every feature type has a recognisable marker layer.

### No news appear

Check the RSS URL, the `rss2json.com` response, the selection saved in `feedSelections` and the browser's network restrictions.

### A calendar does not appear

Check that the ICS path is reachable, that the content is valid and that the checkbox is selected. Look at the console for parser errors.

### An old version is shown

The browser may be using the service worker or a cached response. Bump `CACHE_NAME`, unregister the service worker during the test, or clear the site data. Remember the stale-while-revalidate behaviour: the new version shows up on the second visit.

### A home tile HTML is not available offline

Add the documents of `/univ/` to `staticAssets` in `sw.js`, together with their scripts, styles and dependent images. (The example pages of `univ/` are already part of that list; any new tile page must be added.)

### Geolocation fails

Check the browser permissions, HTTPS, the availability of the device and the operating system settings.

### The deploy tool fails

- `deploy_config.json not found` — copy the example file and fill it in.
- `the working tree is dirty` / `the local main is not what is on GitHub` — commit and push first: a deploy must always be reproducible from the repository.
- The remote copy fails — check that the server has `rsync` installed (the staging step needs it) and that the SSH user can write to the staging folder.
- `the web serves version X, expected Y` — the copy step did not reach the web root; check the sudo output and the configured paths before announcing anything.