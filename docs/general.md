# GadirE documentation

GadirE is an interactive map of the University of Cádiz driven by the Student Council. It makes it possible to locate university spaces, consult campus information, reach frequently used resources, view calendars and read the news, all inside a web app installable as a PWA.

## Documents

- User guide: using the map, search, filters, calendar, notifications and settings.
- Administration guide: updating contents and data sources without touching the code.
- Development guide: architecture, modules, dependencies and execution flow.
- Data model: structure of the GeoJSON, institutional configuration, calendars and feeds.
- Deployment and maintenance: the deployment tool, publication, the service worker cache, checks and incident resolution.
- Privacy and licences: local storage, external services and third-party obligations.
- Home tiles: specific reference for configuring the home-screen shortcuts.

## State of the project

The current version is a preliminary release. The map contents may contain mistakes or omissions and must be maintained through the sources and procedures described in this documentation.

## Profiles

- **User:** consults the map and personalises the experience from the browser.
- **Administrator or content maintainer:** updates the GeoJSON, the shortcuts, the calendars and the feeds.
- **Developer:** maintains the interface, the JavaScript modules, the styles, the dependencies and the service worker.

## How it works

The application has no backend of its own. The server delivers static files and the browser loads the data, runs the JavaScript and saves the preferences in `localStorage`. Therefore, any content change means updating the project's files and publishing them again — with the deployment tool described in , which never touches the served data folder.