// Array para almacenar las URLs de los feeds seleccionados
let selectedFeedUrls = ["https://ceuca.uca.es/feed"];

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
                const channelInfo = document.createElement("div");
                channelInfo.className = "channel-info";
                channelInfo.innerHTML = `
                    <h2>${data.feed.title}</h2>
                    <p>${data.feed.description}</p>
                    ${data.feed.image ? `<img src="${data.feed.image}" alt="Logo del canal" style="max-width: 200px;" />` : ''}
                `;
                feedElement.appendChild(channelInfo);

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
            const itemElement = document.createElement("div");
            itemElement.className = "entry";
            itemElement.innerHTML = `
                <div class="notification-item">
                    <div class="feed-source" style="background-color: #f0f0f0; padding: 2px 5px; display: inline-block; margin-bottom: 5px;">
                        ${item.feedSource}
                    </div>
                    <h3><a href="${item.link}" target="_blank" class="enlace-con-icono">${item.title}</a></h3>
                    ${item.thumbnail ? `<img src="${item.thumbnail}" alt="Portada" style="max-width: 100%;" />` : ''}
                    <p>${item.description}</p>
                    <p><small>Publicado: ${item.pubDate} | Autor: ${item.author || 'Desconocido'}</small></p>
                    <p><strong>Categorías:</strong> ${item.categories ? item.categories.join(", ") : 'Ninguna'}</p>
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