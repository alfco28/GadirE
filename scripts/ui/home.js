document.addEventListener('DOMContentLoaded', cargarHomeTiles);

function getPersonalData() {
    return JSON.parse(localStorage.getItem('personal_data') || '{}');
}

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
}

function openPersonalDataModal() {
    const personalData = getPersonalData();
    const name = personalData.name || 'Sin nombre';
    const barCode = personalData.barCode || '';

    const photo = personalData.photo
        ? `<img class="personal-data-photo" src="${personalData.photo}" alt="Imagen personal">`
        : '';
    
    openMW(
        name,
        `<div class="personal-data-modal">
            ${photo}
            ${barCode
                ? '<svg id="personal-barcode"></svg>'
                : '<p>No hay ningún código de barras guardado.</p>'}
        </div>`
    );

    if (barCode) {
        JsBarcode('#personal-barcode', barCode, {
            format: 'CODE128',
            displayValue: true,
            width: 2,
            height: 80,
            margin: 10
        });
    }
}

function updatePersonalDataTile(name) {
    const tile = document.getElementById('tile-0');
    const text = tile?.querySelector('.home-tile-text');

    if (text) {
        text.textContent = name || '';
    }
}

window.addEventListener('personalDataUpdated', event => {
    updatePersonalDataTile(event.detail.name);
});

window.addEventListener('personalDataUpdated', event => {
    const tile = document.getElementById('tile-0');
    const content = tile?.querySelector('.home-tile-content');

    if (!content || !event.detail.photo) {
        return;
    }

    const currentImage = content.querySelector('.home-tile-image');

    if (currentImage) {
        currentImage.src = event.detail.photo;
        return;
    }

    const image = document.createElement('img');
    image.src = event.detail.photo;
    image.alt = 'Imagen personal';
    image.className = 'home-tile-image';

    const currentIcon = content.querySelector('.home-tile-icon');
    currentIcon?.replaceWith(image);
});

function applyProjectTheme(frameDocument) {
  const projectFont = getComputedStyle(document.body).fontFamily;
  const projectRoot = getComputedStyle(document.documentElement);
  const frameRoot = frameDocument.documentElement;

  // Copia el estado de tema para que el HTML pueda usar selectores html.dark.
  frameRoot.classList.toggle(
    'dark',
    document.documentElement.classList.contains('dark')
  );

  // Comparte los tokens de color ya resueltos por las preferencias de GadirE.
  [
    '--color-enfasis',
    '--color-fondo-primario',
    '--color-texto-primario',
    '--color-texto-secundario'
  ].forEach(property => {
    const value = projectRoot.getPropertyValue(property).trim();

    if (value) {
      frameRoot.style.setProperty(property, value);
    }
  });

  // No añadas la regla de fuente más de una vez al mismo documento.
  if (!frameDocument.getElementById('gadire-home-tile-theme')) {
    const themeStyle = frameDocument.createElement('style');
    themeStyle.id = 'gadire-home-tile-theme';
    themeStyle.textContent = `
      :where(body),
      :where(body *),
      :where(body *::before),
      :where(body *::after) {
        font-family: ${projectFont} !important;
      }
    `;

    // Al colocarla antes de los estilos propios, sus reglas !important
    // pueden prevalecer cuando tengan igual especificidad.
    frameDocument.head.prepend(themeStyle);
  }
}

// Función común que crea el iframe y use el <title> del documento cuando termine de cargar. El título de la tile queda como texto provisional mientras se carga
function createHomeTileFrame(filePath, fallbackTitle, onTitleLoaded, mode) {
  const frame = document.createElement('iframe');
  frame.className = `home-tile-html-frame home-tile-html-frame--${mode}`;
  frame.title = fallbackTitle || 'Contenido de la tile';

  frame.addEventListener('load', () => {
    try {
      const frameDocument = frame.contentDocument;

      if (!frameDocument?.head) {
        return;
      }
    
      // Unifica la tipografía del contenido sin impedir excepciones explícitas.
      applyProjectTheme(frameDocument);
    
      const htmlTitle = frameDocument.title.trim();
      if (htmlTitle) {
        onTitleLoaded(htmlTitle);
      }
    } catch (error) {
      // Si el documento no es del mismo origen, se conserva el título provisional.
      console.warn('No se pudo leer el título del HTML de la tile:', error);
    }
  });

  frame.src = filePath;
  return frame;
}

function bindTileActivation(tile, role, activate) {
  tile.setAttribute('role', role);
  tile.setAttribute('tabindex', '0');

  tile.addEventListener('click', activate);
  tile.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
}

function openHtmlTile(tileConfig) {
  const fallbackTitle = tileConfig.text || '';
  const mode = tileConfig.openAs;

  let frame;

  if (mode === 'modal') {
    frame = createHomeTileFrame(
      tileConfig.html,
      fallbackTitle,
      htmlTitle => {
        const modalBody = document.getElementById('mw-body');
        if (frame.parentElement === modalBody) {
          document.getElementById('mw-title').textContent = htmlTitle;
        }
      },
      'modal'
    );

    // openMW acepta nodos DOM y ya se encarga de colocar el título y el contenido.
    openMW(fallbackTitle, frame);
    return;
  }

  if (mode === 'fullscreen') {
    frame = createHomeTileFrame(
      tileConfig.html,
      fallbackTitle,
      () => {},
      'fullscreen'
    );

    window.openHomeTileScreen(frame, fallbackTitle);
  }
}

async function cargarHomeTiles() {
    try {
        const response = await fetch('/config/univ.json');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const config = await response.json();
        const tiles = config.homeTiles || [];

        tiles.forEach(tileConfig => {
            // Obtén y valida la tile antes de usarla en sus handlers.
            const tile = document.getElementById(tileConfig.id);
                  
            if (!tile) {
              console.warn(`No se encontró la tile con id "${tileConfig.id}"`);
              return;
            }
        
            const content = tile.querySelector('.home-tile-content');
        
            if (!content) {
              console.warn(`La tile "${tileConfig.id}" no tiene .home-tile-content`);
              return;
            }

            content.replaceChildren();

            const savedPersonalData = JSON.parse(
                localStorage.getItem('personal_data') || '{}'
            );

            const tilePhoto = tileConfig.id === 'tile-0'
                ? savedPersonalData.photo
                : tileConfig.image;

            if (tilePhoto) {
                const image = document.createElement('img');
                image.src = tilePhoto;
                image.alt = tileConfig.alt || tileConfig.text || '';
                image.className = 'home-tile-image';

                content.appendChild(image);
            } else if (tileConfig.icon) {
                const icon = document.createElement('i');
                icon.className = `${tileConfig.icon} home-tile-icon`;
                icon.setAttribute('aria-hidden', 'true');

                content.appendChild(icon);
            }

            const text = document.createElement('span');
            text.className = 'home-tile-text';

            text.textContent = tileConfig.id === 'tile-0'
                ? savedPersonalData.name || ''
                : tileConfig.text || '';

            content.appendChild(text);

            // Registra una única acción según el tipo de tile.
            if (tileConfig.id === 'tile-0') {
              bindTileActivation(tile, 'button', openPersonalDataModal);
            } else if (
              (tileConfig.openAs === 'modal' ||
                tileConfig.openAs === 'fullscreen') &&
              tileConfig.html
            ) {
              bindTileActivation(tile, 'button', () => openHtmlTile(tileConfig));
            } else if (tileConfig.url) {
              bindTileActivation(tile, 'link', () => {
                window.location.assign(tileConfig.url);
              });
            }
        });
    } catch (error) {
        console.error('No se pudieron cargar las tiles de inicio:', error);
    }
}