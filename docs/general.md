# Documentación de GadirE

GadirE es un mapa interactivo de la Universidad de Cádiz impulsado por el Consejo de Estudiantes. Permite localizar espacios universitarios, consultar información del campus, acceder a recursos frecuentes, visualizar calendarios y leer noticias mediante una aplicación web instalable como PWA.

## Documentos

- [Guía de usuario](user.md): uso del mapa, búsqueda, filtros, calendario, noticias y configuración.
- [Guía de administración](admin.md): actualización de contenidos y fuentes de datos sin modificar el código.
- [Guía de desarrollo](develop.md): arquitectura, módulos, dependencias y flujo de ejecución.
- [Modelo de datos](data.md): estructura del GeoJSON, configuración institucional, calendarios y feeds.
- [Despliegue y mantenimiento](deploy.md): publicación, caché, comprobaciones y resolución de incidencias.
- [Privacidad y licencias](privacy.md): almacenamiento local, servicios externos y obligaciones de terceros.
- [Tiles de inicio](home.md): referencia específica para configurar los accesos de la pantalla de inicio.

## Estado del proyecto

La versión actual es una versión preliminar. El contenido del mapa puede contener errores u omisiones y debe mantenerse mediante las fuentes y procedimientos descritos en esta documentación.

## Perfiles

- **Usuario:** consulta el mapa y personaliza la experiencia desde el navegador.
- **Administrador o responsable de contenidos:** actualiza el GeoJSON, los accesos, los calendarios y los feeds.
- **Desarrollador:** mantiene la interfaz, los módulos JavaScript, los estilos, las dependencias y el service worker.

## Principio de funcionamiento

La aplicación no dispone de backend propio. El servidor entrega archivos estáticos y el navegador carga los datos, ejecuta JavaScript y guarda las preferencias en `localStorage`. Por ello, cualquier cambio de contenido requiere actualizar los archivos del proyecto y publicarlos de nuevo.
