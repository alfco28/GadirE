# Privacy, external services and licences

## Personal data

The name, the surnames, the centre, the campus, the photograph, the barcode and the related preferences are stored in the browser's `localStorage` under `personal_data`. There is no user account and no own server that synchronises this data.

The photograph is scaled down and converted to a JPEG string before being saved locally. The data can disappear if the user clears the site data, switches browsers or uses another device.

The option to include personal data when exporting appears in the interface, but import and export are not currently implemented.

## Geolocation

The position is requested through the browser's geolocation API when the user activates the follow button. While it is active, the browser provides location updates and the map keeps the marker centred; pressing the button again stops the follow. The position is only held in memory during the session: it is neither stored nor sent to any server of ours. The device orientation is requested separately when the browser requires it, only to point the marker's indicator.

The effective permission is controlled by the browser and can be revoked from its settings.

## Cookies and storage

The interface shows a cookie notice, but in the reviewed version there is no JavaScript logic persisting the acceptance or the rejection. The functional preferences are stored with `localStorage`, which is not equivalent to a cookie.

Before publishing changes on privacy matters, the actual behaviour of cookies, analytics, CDNs and external providers must be reviewed.

## External services

The application's code and libraries are all served from its own origin (vendored under `/libraries/`; no CDN). At runtime the application contacts or may contact:

- the OpenStreetMap tile servers (the map basemap);
- `rss2json.com`, to transform the RSS feeds selected by the user;
- the RSS feeds and the sites linked from the tiles;
- the URLs of the ICS calendars configured by the administrator (local files or remote calendars).

These services can receive requests from the user's browser and have their own conditions and policies. The URLs and attributions must be kept up to date.

## Deployment tooling (for maintainers)

The deployment tool keeps its private details (SSH host, user, paths) in `deploy_config.json`, which is gitignored, and its logs live in `deploy_logs/`, which is gitignored and never published to the web: both may contain infrastructure details. Nothing of this reaches the served folder on a deploy.

## Licence of the project

The main licence and the redistribution conditions are in [LICENCE](../LICENCE). Distribution must respect the licences of the third-party components and keep their notices.

Among the dependencies and sources indicated by the project:

- Leaflet, BSD 2-Clause.
- OpenStreetMap data, ODbL.
- Leaflet.markercluster, MIT.
- CARTO Basemaps, subject to their terms of service if used again.
- Fuse.js, Apache-2.0.
- Font Awesome Free, CC BY 4.0 for the applicable elements.
- FullCalendar, MIT.
- ical.js, MPL-2.0.
- JsBarcode, MIT.
- marked, MIT.

## Recommendations for maintainers

- Do not introduce personal data in the GeoJSON or in `config/univ.json`.
- Do not publish personal photographs in `assets` without authorisation.
- Review the external URLs before every deployment.
- Keep the attributions of maps, icons and libraries.
- Update this documentation if analytics, accounts, push, non-essential cookies or a backend are added.