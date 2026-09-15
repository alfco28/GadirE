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

`image` e `icon` son excluyentes: debe configurarse únicamente una de las dos (la otra debe ser `null`).

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