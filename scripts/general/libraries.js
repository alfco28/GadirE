// Cargar Leaflet y el mapa
loadExternalScripts(initMap);

function loadExternalScripts(callback) {
  let loadedCount = 0;
  const totalScripts = 2;

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
}

function initMap() {
  const map = L.map('map', {
    zoomControl: false,
  }).setView([36.5298, -6.2035], 16);

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { maxZoom:20, attribution:'Map data from <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>. © <a href="https://carto.com/about-carto/">rastertiles/voyager</a>' }
  ).addTo(map);
}