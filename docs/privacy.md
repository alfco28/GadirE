# Privacidad, servicios externos y licencias

## Datos personales

El nombre, los apellidos, el centro, el campus, la fotografía, el código de barras y las preferencias relacionadas se guardan en el `localStorage` del navegador bajo `personal_data`. No existe una cuenta de usuario ni un servidor propio que sincronice esos datos.

La fotografía se reduce y se convierte a una cadena JPEG antes de guardarse localmente. Los datos pueden desaparecer si el usuario borra los datos del sitio, cambia de navegador o utiliza otro dispositivo.

La opción de incluir datos personales al exportar aparece en la interfaz, pero la importación y exportación no están implementadas actualmente.

## Geolocalización

La posición se solicita mediante la API de geolocalización del navegador cuando el usuario activa el botón de seguimiento. Mientras está activo, el navegador proporciona actualizaciones de ubicación y el mapa mantiene el marcador centrado; al pulsar el botón de nuevo se detiene el seguimiento. La posición solo se mantiene en memoria durante la sesión y no se guarda ni se envía a un backend propio. La orientación del dispositivo se solicita por separado cuando el navegador lo requiere, únicamente para orientar el indicador del marcador.

El permiso efectivo lo controla el navegador y puede revocarse desde sus ajustes.

## Cookies y almacenamiento

La interfaz incluye un aviso de cookies, pero en la versión revisada no existe lógica JavaScript que persista la aceptación o el rechazo. Las preferencias funcionales se guardan mediante `localStorage`, que no es equivalente a una cookie.

Antes de publicar cambios en materia de privacidad, debe revisarse el comportamiento real de cookies, analítica, CDN y proveedores externos.

## Servicios externos

La aplicación utiliza o puede utilizar:

- teselas de OpenStreetMap;
- CDN de Font Awesome;
- CDN de JsBarcode;
- CDN de `ical.js`;
- sitios enlazados desde las tiles;
- `rss2json.com` para transformar feeds RSS.

Estos servicios pueden recibir solicitudes desde el navegador del usuario y tienen sus propias condiciones y políticas. Las URLs y atribuciones deben mantenerse actualizadas.

## Licencia del proyecto

La licencia principal y las condiciones de redistribución están en [LICENSE](../LICENSE). La distribución debe respetar las licencias de los componentes de terceros y conservar sus avisos correspondientes.

Entre las dependencias y fuentes indicadas por el proyecto se encuentran:

- Leaflet, BSD 2-Clause.
- Datos de OpenStreetMap, ODbL.
- CARTO Basemaps, sujeto a sus condiciones de servicio si se vuelve a utilizar.
- Fuse.js, Apache-2.0.
- Font Awesome Free, CC BY 4.0 para los elementos aplicables.
- FullCalendar, MIT.

## Recomendaciones para responsables

- No introducir datos personales en el GeoJSON ni en `config/univ.json`.
- No publicar fotografías personales dentro de `assets` sin autorización.
- Revisar las URLs externas antes de cada despliegue.
- Conservar atribuciones de mapas, iconos y bibliotecas.
- Actualizar esta documentación si se añade analítica, cuentas, push, cookies no esenciales o un backend.
