// URL del feed RSS (cámbiala por la tuya)
const feedUrl = "http://feeds.bbci.co.uk/news/rss.xml";
// Usamos RSS-to-JSON para convertir el feed a JSON
const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

// Cargar el feed
function cargarFeed() {
    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            const feedElement = document.getElementById("feed");

            // Mostrar metadatos del canal
            const channelInfo = document.createElement("div");
            channelInfo.innerHTML = `
                <h2>${data.feed.title}</h2>
                <p>${data.feed.description}</p>
                ${data.feed.image ? `<img src="${data.feed.image}" alt="Logo del canal" style="max-width: 200px;" />` : ''}
            `;
            feedElement.appendChild(channelInfo);

            // Mostrar cada entrada
            data.items.forEach(item => {
                const itemElement = document.createElement("div");
                itemElement.className = "entry";
                itemElement.innerHTML = `
                    <div class="notification-item">
                        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="Portada" />` : ''}
                        <p>${item.description}</p>
                        <p><small>Publicado: ${item.pubDate} | Autor: ${item.author || 'Desconocido'}</small></p>
                        <p><strong>Categorías:</strong> ${item.categories ? item.categories.join(", ") : 'Ninguna'}</p>
                    </div>
                `;
                feedElement.appendChild(itemElement);
            });
        })
        .catch(error => {
            console.error("Error al cargar el feed:", error);
            document.getElementById("feed").innerHTML = "<p>Error al cargar el feed. Verifica la URL.</p>";
        });
}

// Recargar el feed al hacer click en el icono de recargar
document.getElementById("refresh-notifications").addEventListener("click", () => {
    document.getElementById("feed").innerHTML = ""; // Limpiar el feed antes de recargar
    cargarFeed();
});

// Cargar el feed al iniciar la aplicación
cargarFeed();

// Actualizar cada 5 minutos (300.000 milisegundos)
setInterval(cargarFeed, 300000);