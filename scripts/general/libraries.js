// Cargar Leaflet y el mapa
loadExternalScripts(initMap);

function loadExternalScripts(callback) {
  let loadedCount = 0;
  const totalScripts = 4;

  function checkAllLoaded() {
    loadedCount++;
    if (loadedCount === totalScripts) {
      callback();
    }
  }

  // Cargar Leaflet CSS
  const leafletCSS = document.createElement('link');
  leafletCSS.rel = 'stylesheet';
  leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  leafletCSS.onload = checkAllLoaded;
  document.head.appendChild(leafletCSS);

  // Cargar Leaflet JS
  const leafletJS = document.createElement('script');
  leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  leafletJS.onload = checkAllLoaded;
  document.head.appendChild(leafletJS);

  // Cargar Leaflet Search CSS
  const searchCSS = document.createElement('link');
  searchCSS.rel = 'stylesheet';
  searchCSS.href = 'https://unpkg.com/leaflet-search/dist/leaflet-search.min.css';
  searchCSS.onload = checkAllLoaded;
  document.head.appendChild(searchCSS);

  // Cargar Leaflet Search JS
  const searchJS = document.createElement('script');
  searchJS.src = 'https://unpkg.com/leaflet-search/dist/leaflet-search.min.js';
  searchJS.onload = checkAllLoaded;
  document.head.appendChild(searchJS);
}