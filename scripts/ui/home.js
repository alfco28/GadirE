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

async function cargarHomeTiles() {
    try {
        const response = await fetch('/config/univ.json');

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const config = await response.json();
        const tiles = config.homeTiles || [];

        tiles.forEach(tileConfig => {
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

            if (tileConfig.id === 'tile-0') {
                tile.setAttribute('role', 'button');
                tile.setAttribute('tabindex', '0');
                        
                tile.addEventListener('click', openPersonalDataModal);
                        
                tile.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPersonalDataModal();
                    }
                });
            } else if (tileConfig.url) {
                tile.setAttribute('role', 'link');
                tile.setAttribute('tabindex', '0');
            
                const redirectToTileUrl = () => {
                    window.location.assign(tileConfig.url);
                };
            
                tile.addEventListener('click', redirectToTileUrl);
            
                tile.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        redirectToTileUrl();
                    }
                });
            }
        });
    } catch (error) {
        console.error('No se pudieron cargar las tiles de inicio:', error);
    }
}