# Guía de usuario

## Acceso e instalación

GadirE funciona en un navegador moderno de escritorio o móvil. También puede instalarse como aplicación PWA desde el menú del navegador mediante una opción similar a **Añadir a pantalla de inicio**.

La versión publicada necesita conexión para cargar recursos externos y datos que no estén disponibles en caché. La instalación no crea una cuenta ni envía los datos personales guardados en el dispositivo.

## Navegación principal

La barra inferior permite cambiar entre:

- **Buscar:** abre la barra lateral con el listado de espacios y el buscador.
- **Mapa:** muestra el mapa y sus marcadores.
- **Inicio:** muestra los accesos rápidos configurados por el responsable del proyecto.
- **Calendario:** muestra los eventos de los calendarios seleccionados.
- **Notificaciones:** muestra las publicaciones de los feeds seleccionados.

El icono de configuración de la pantalla de inicio abre las preferencias.

## Buscar un espacio

1. Abre **Buscar**.
2. Escribe parte del nombre, edificio, campus, tipo o descripción.
3. Selecciona un resultado para centrar el mapa y abrir su ficha.
4. En dispositivos compatibles, usa `Ctrl+K` o `Cmd+K` para enfocar directamente el buscador.

La búsqueda admite coincidencias exactas y aproximadas. Los resultados respetan los filtros activos y se limita la lista visible para evitar una carga excesiva.

## Filtrar el mapa

Los filtros disponibles son:

- Tipo de espacio.
- Campus.
- Edificio.
- Planta.

Los filtros se combinan entre sí. Al seleccionar una opción, se actualizan los marcadores y el listado lateral.

## Consultar y compartir un lugar

Pulsa un marcador para consultar su nombre, descripción, planta, edificio y campus. El botón de compartir genera un enlace con el identificador del lugar. En navegadores compatibles usa el diálogo nativo de compartir; en los demás copia el enlace al portapapeles.

También puedes pulsar una zona vacía del mapa para abrir el formulario de reporte de un lugar que falte.

## Geolocalización

El botón de ubicación solicita permiso al navegador y muestra la posición aproximada del dispositivo en el mapa. La posición no se guarda en el proyecto ni se envía a GadirE.

La geolocalización depende del permiso del navegador, del dispositivo y de que la página se sirva mediante HTTPS.

## Inicio y accesos rápidos

Las tiles de inicio enlazan con servicios externos, como Biblioteca, Campus Virtual, Portal de Servicios o transporte. El contenido de estas tiles lo configura el administrador en `config/univ.json`.

La primera tile puede mostrar los datos personales locales del usuario y un código de barras si se han introducido en configuración.

## Calendario

En la configuración se pueden activar o desactivar calendarios agrupados por temática. Los calendarios se leen en formato ICS y sus eventos aparecen en la vista de calendario. Al pulsar un evento se muestran fecha, ubicación y descripción cuando están disponibles.

Las selecciones se conservan localmente en el navegador.

## Noticias

En la configuración se eligen los feeds RSS disponibles. La pantalla de notificaciones combina sus entradas y las ordena de la más reciente a la más antigua. El botón de recarga vuelve a consultarlos y la aplicación realiza también una actualización periódica.

Los feeds dependen de sus sitios de origen y del servicio externo `rss2json.com`; pueden fallar o tardar en cargar.

## Configuración

La aplicación ofrece opciones de privacidad, accesibilidad, personalización, idioma, calendarios y fuentes de noticias. Actualmente funcionan de forma efectiva el tamaño de fuente, contraste, negrita, transparencias, velocidad de animación, modo oscuro, color de énfasis, visibilidad de filtros, idioma, datos personales y selecciones de feeds/calendarios.

Algunas opciones están visibles pero aún no tienen una implementación completa: mapa base, controles de zoom, página inicial, ubicación inicial, notificaciones push, filtros de notificaciones e importación/exportación.
