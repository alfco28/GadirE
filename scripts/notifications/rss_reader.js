// Array para almacenar las URLs de los feeds seleccionados
let selectedFeedUrls = [];
let selectedFeeds = {}; // Objeto para almacenar los feeds seleccionados

// Cargar el JSON y generar el selector de feeds
fetch('/config/univ.json')
    .then(response => response.json())
    .then(data => {
        generateFeedSelector(data.feeds);
        loadSavedFeedSelections();
        loadCheckedFeeds();
    })
    .catch(error => console.error('Error al cargar el JSON:', error));

// Generar selector de feeds
function generateFeedSelector(feedsData) {
    const selector = document.getElementById('feed-options');
    selector.innerHTML = ''; // Limpiar contenido previo

    for (const [theme, feeds] of Object.entries(feedsData.byTheme)) {
        const themeDiv = document.createElement('div');
        themeDiv.className = 'theme-section';

        const themeTitle = document.createElement('h3');
        themeTitle.textContent = theme;
        themeDiv.appendChild(themeTitle);

        feeds.forEach(feed => {
            const label = document.createElement('label');
            label.className = 'feed-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'feed';
            checkbox.value = feed.url;
            checkbox.id = feed.id;
            checkbox.checked = feed.checked;

            const span = document.createElement('span');
            span.textContent = feed.name;

            label.appendChild(checkbox);
            label.appendChild(span);
            themeDiv.appendChild(label);
        });

        selector.appendChild(themeDiv);
    }
}

// Guardar selección de feeds en localStorage
function saveFeedSelection(id, isChecked) {
    const selections = JSON.parse(localStorage.getItem('feedSelections') || '{}');
    selections[id] = isChecked;
    localStorage.setItem('feedSelections', JSON.stringify(selections));
}

// Cargar selección de feeds guardada en localStorage
function loadSavedFeedSelections() {
    const selections = JSON.parse(localStorage.getItem('feedSelections') || '{}');
    document.querySelectorAll('input[name="feed"]').forEach(checkbox => {
        if (selections[checkbox.id] !== undefined) {
            checkbox.checked = selections[checkbox.id];
        }
    });
}

// Cargar feeds marcados (por defecto o localStorage)
function loadCheckedFeeds() {
    selectedFeedUrls = []; // Limpiar el array antes de cargar los feeds seleccionados
    document.querySelectorAll('input[name="feed"]:checked').forEach(checkbox => {
        if (!selectedFeedUrls.includes(checkbox.value)) {
            selectedFeedUrls.push(checkbox.value);
        }
    });
    cargarFeedsSeleccionados();
}

// Escuchar cambios en los checkboxes de feeds
document.getElementById('feed-options').addEventListener('change', function(e) {
    if (e.target.name === 'feed') {
        const checkbox = e.target;
        saveFeedSelection(checkbox.id, checkbox.checked);

        if (checkbox.checked && !selectedFeedUrls.includes(checkbox.value)) {
            selectedFeedUrls.push(checkbox.value);
        } else if (!checkbox.checked) {
            selectedFeedUrls = selectedFeedUrls.filter(url => url !== checkbox.value);
        }

        cargarFeedsSeleccionados();
    }
});

// Cargar y mezclar feeds seleccionados
function cargarFeedsSeleccionados() {
    document.getElementById("feed").innerHTML = "";
    const feedElement = document.getElementById("feed");

    // Si no hay feeds seleccionados, mostrar mensaje
    if (selectedFeedUrls.length === 0) {
        feedElement.innerHTML = "<p>Selecciona al menos un feed para mostrar contenido.</p>";
        return;
    }

    // Array para almacenar todas las entradas con su fuente
    let allItems = [];

    // Promesas para cargar cada feed
    const fetchPromises = selectedFeedUrls.map(feedUrl => {
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        return fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                // Añadir metadatos del canal
                /*const channelInfo = document.createElement("div");
                channelInfo.className = "channel-info";
                channelInfo.innerHTML = `
                    <h2>${data.feed.title}</h2>
                    <p>${data.feed.description}</p>
                    ${data.feed.image ? `<img src="${data.feed.image}" alt="Logo del canal" style="max-width: 200px;" />` : ''}
                `;
                feedElement.appendChild(channelInfo);*/

                // Añadir entradas al array global, incluyendo el nombre del feed
                data.items.forEach(item => {
                    allItems.push({
                        ...item,
                        feedSource: data.feed.title // Añadir la fuente de la entrada
                    });
                });
            })
            .catch(error => {
                console.error(`Error al cargar el feed ${feedUrl}:`, error);
            });
    });

    // Esperar a que todos los feeds se carguen
    Promise.all(fetchPromises).then(() => {
        // Ordenar todas las entradas por fecha (de más reciente a más antigua)
        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // Mostrar entradas ordenadas
        allItems.forEach(item => {
            // Dar formato a la fecha
            const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date(item.pubDate));

            // Controlar la imagen
            let imagenHTML = '';
            if (item.thumbnail) {
                imagenHTML = `<img src="${item.thumbnail}" alt="Portada" class="feed-image" onerror="this.src='/assets/logo_gadire.webp';" />`;
            } else if (item.enclosure && item.enclosure.link) {
                imagenHTML = `<img src="${item.enclosure.link}" alt="Portada" class="feed-image" onerror="this.src='/assets/logo_gadire.webp';" />`;
            }

            const itemElement = document.createElement("div");
            itemElement.className = "entry";
            itemElement.innerHTML = `
                <div class="notification-item">
                    <p class="feed-source">
                        ${fechaFormateada} - ${item.feedSource}
                    </p>
                    <h3><a href="${item.link}" target="_blank" class="enlace-con-icono">${item.title}</a></h3>
                    ${imagenHTML}
                    <p>${item.description}</p>
                </div>
            `;
            feedElement.appendChild(itemElement);
        });
    });
}

// Actualizar la lista de feeds seleccionados
function actualizarFeedsSeleccionados() {
    const checkboxes = document.querySelectorAll('input[name="feed"]:checked');
    selectedFeedUrls = Array.from(checkboxes).map(checkbox => checkbox.value);
    cargarFeedsSeleccionados();
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Event listener para los checkboxes de feeds
    const feedCheckboxes = document.querySelectorAll('input[name="feed"]');
    feedCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", actualizarFeedsSeleccionados);
    });

    // Event listener para el botón de recargar
    const refreshButton = document.getElementById("refresh-notifications");
    if (refreshButton) {
        refreshButton.addEventListener("click", cargarFeedsSeleccionados);
    }
}

// Cargar todo cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    inicializarEventListeners();
    cargarFeedsSeleccionados();
    setInterval(cargarFeedsSeleccionados, 300000);
});