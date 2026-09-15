document.addEventListener('DOMContentLoaded', cargarHomeTiles);

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

            if (tileConfig.image) {
                const image = document.createElement('img');
                image.src = tileConfig.image;
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
            text.textContent = tileConfig.text || '';

            content.appendChild(text);

            if (tileConfig.url) {
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