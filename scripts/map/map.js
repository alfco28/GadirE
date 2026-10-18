// ================= INDEXACIÓN =================
const index = {
  campus: {},
  edificio: {},
  planta: {},
  tipo: {},
  all: new Set()
};
index.search = {};

// ================= ESTADO =================
const state = {
  edificio: "todos",
  planta: "todas",
  tipo: "todos",
  campus: "todos"
};

// =============== CONSTANTES GLOBALES ===============
const MOBILE_BREAKPOINT = 768;
const DEFAULT_ZOOM = 16;
const FLY_ZOOM = 19;

let searchControl = null;
let campusGeoJSON = null;

// ================= BUSQUEDA INDEXADA =================

// Normaliza texto: minusculas sin tildes
function normaliseText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Tokeniza palabras
function tokenise(str) {
  return normaliseText(str)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Indexar texto de features
function buildSearchIndex(features) {
  features.forEach(f => {
    const p = f.properties;

    const searchableText = `
      ${p.nombre}
      ${p.edificio}
      ${p.tipo}
      ${p.campus}
      ${p.descrip || ""}
    `;

    const tokens = tokenise(searchableText);

    tokens.forEach(token => {
      if (!index.search[token]) index.search[token] = new Set();
      index.search[token].add(f);
    });
  });
}

// Buscar con intersección de tokens
function searchFeatures(query, baseFeatures) {
  if (!query.trim()) return baseFeatures;

  const tokens = tokenise(query);

  if (!tokens.length) return baseFeatures;

  let resultSets = tokens.map(t => index.search[t] || new Set());

  let result = resultSets[0];

  for (let i = 1; i < resultSets.length; i++) {
    result = new Set([...result].filter(f => resultSets[i].has(f)));
  }

  // Intersección con filtros activos
  const baseSet = new Set(baseFeatures);
  result = new Set([...result].filter(f => baseSet.has(f)));

  return Array.from(result);
}

// ================= FILTRADO =================
function getFilteredFeatures() {
  let sets = [];

  if (state.campus !== "todos") {
    sets.push(index.campus[state.campus] || new Set());
  }
  if (state.edificio !== "todos") {
    sets.push(index.edificio[state.edificio] || new Set());
  }
  if (state.planta !== "todas") {
    sets.push(index.planta[state.planta] || new Set());
  }
  if (state.tipo !== "todos") {
    sets.push(index.tipo[state.tipo] || new Set());
  }

  // Si no hay filtros activos → todos
  if (sets.length === 0) {
    return Array.from(index.all);
  }

  // Intersección de sets
  let result = sets[0];
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter(f => sets[i].has(f)));
  }

  return Array.from(result);
}

// =============== POPUP en HTML ===============
function popupHTML(p) {
  const currentUrl = window.location.href.split('#')[0]; // Obtiene la URL sin hash
  const shareUrl = `${currentUrl}#${p.idnum}`; // Crea la URL con el hash
  const buttonId = `shareButton_${p.idnum}`; // Identificador único para el botón

  return `
      <div class="popup-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4>${p.nombre}</h4>
          <button
              id="${buttonId}"
              style="padding: 6px 8px; margin: 0 0 0 4px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
        <p>${p.descrip}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Planta ${p.planta}</span>
          <span style="color: #A0A0A0; font-size: 10px;">#${p.idnum}</span>
        </div>
        <span>Edificio: ${p.edificio}</span>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Campus: ${p.campus}</span>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdEZjtvKMVmpLC3zcajTqxQdqtVs6yuITLAooP6FPez8nhKoQ/viewform?usp=pp_url&entry.2020790469=${p.idnum}" 
              style="text-decoration: none; color: #A0A0A0; transition: color 0.2s;"
              target="_blank"
              rel="noopener noreferrer"
              onmouseover="this.style.color='#808080'" 
              onmouseout="this.style.color='#A0A0A0'">
            <i class="fa-solid fa-circle-exclamation"></i>
          </a>
        </div>
      </div>`;
}

// ================= CREAR MARKERS UNA SOLA VEZ =================

function featureKey(f) { // Función para crear un marker único para cada feature.
  const p = f.properties;
  return `${p.idnum}`;
}

// ================= HELPER =================
function isMobile() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

// ================= CARGAR GEOJSON =================
fetch('/data/map_data.geojson')
  .then(response => response.json())
  .then(data => processGeoJSON(data))
  .catch(error => console.error('Error al cargar el archivo GeoJSON:', error));

// ================= FUNCIONES =================
function processGeoJSON(data) {
  campusGeoJSON = data;

  // Indexar los datos
  campusGeoJSON.features.forEach(f => {
    index.all.add(f);

    const { campus, edificio, planta, tipo } = f.properties;

    if (!index.campus[campus]) index.campus[campus] = new Set();
    if (!index.edificio[edificio]) index.edificio[edificio] = new Set();
    if (!index.planta[planta]) index.planta[planta] = new Set();
    if (!index.tipo[tipo]) index.tipo[tipo] = new Set();

    index.campus[campus].add(f);
    index.edificio[edificio].add(f);
    index.planta[planta].add(f);
    index.tipo[tipo].add(f);
  });

  buildSearchIndex(campusGeoJSON.features);
  initMap();
}

function initMap() {
  const map = L.map('map', {
    zoomControl: false,
  }).setView([36.5297, -6.2118], 16);

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { maxZoom:20, attribution:'Map data from <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>. © <a href="https://carto.com/about-carto/">rastertiles/voyager</a>' }
  ).addTo(map);

  // ================= CAPAS PERSISTENTES =================
  const layersByTipo = {
    descanso: L.layerGroup(),
    aseo: L.layerGroup(),
    aula: L.layerGroup(),
    biblio: L.layerGroup(),
    cafete: L.layerGroup(),
    despacho: L.layerGroup(),
    lab: L.layerGroup(),
    repre: L.layerGroup(),
    salon: L.layerGroup(),
    transporte: L.layerGroup(),
    unidad: L.layerGroup()
  };

  // Añadimos TODAS las capas al mapa inicialmente
  Object.values(layersByTipo).forEach(l => l.addTo(map));
  let userLocationMarker = null;
  
  // ================= ICONOS =================
  const COLOURS = {
    aula: "#0284c7",
    cafete: "#ea580c",
    biblio: "#2563eb",
    repre: "#7c3aed",
    lab: "#dc2626",
    despacho: "#0f766e",
    descanso: "#facc15",
    aseo: "#64748b",
    salon: "#9333ea",
    transporte: "#16a34a",
    unidad: "#334155"
  };

  function icon(tipo){
    const colour = COLOURS[tipo] || "#6b7280";
    return L.divIcon({
      html: `<div style="background:${colour};width:14px;height:14px;border-radius:50%"></div>`
    });
  }

  const markersByKey = {};

  campusGeoJSON.features.forEach(f => {
    const tipo = f.properties.tipo;
    if (!layersByTipo[tipo]) return;

    const marker = L.marker(
      [f.geometry.coordinates[1], f.geometry.coordinates[0]],
      {
        title: `${f.properties.nombre}, ${f.properties.edificio}`,
        icon: icon(tipo)
      }
    ).bindPopup(popupHTML(f.properties));
    marker.feature = f;

    // Añadir el evento de click al botón de compartir cuando se abra el popup
    marker.on('popupopen', function() {
      const buttonId = `shareButton_${f.properties.idnum}`;
      setTimeout(() => {
        const shareButton = document.getElementById(buttonId);
        if (shareButton) {
          const currentUrl = window.location.href.split('#')[0];
          const shareUrl = `${currentUrl}#${f.properties.idnum}`;
          shareButton.addEventListener('click', () => shareMarker(shareUrl, f.properties.nombre));
        }
      }, 50);
    });

    layersByTipo[tipo].addLayer(marker);
    const key = featureKey(f);
    markersByKey[key] = marker;
  });

  // =============== CAPAS VISIBLES EN EL MAPA ===============
  function updateLayers() {
    const visibles = new Set(getFilteredFeatures());

    for (const tipo in layersByTipo) {
      layersByTipo[tipo].eachLayer(marker => {
        const visible = visibles.has(marker.feature);
        if (visible) marker.addTo(map);
        else map.removeLayer(marker);
      });
    }
  }
  
  // ================= SIDEBAR =================
  const { renderSidebar } = setupSidebar(map, markersByKey, featureKey);
  
  // ================= BUSCADOR =================

  const searchInput = document.getElementById('sidebar-search-bar');
  const searchResults = document.getElementById('sidebar-search-results');

  if (!searchInput || !searchResults) {
    console.warn("Buscador no encontrado en el DOM");
    return;
  }

  function renderSearchResults(features) {
    searchResults.innerHTML = "";

    if (!features.length) {
      searchResults.innerHTML = "<p>No se encontraron resultados</p>";
      return;
    }

    features.slice(0, 50).forEach(f => { // limite seguridad
      const p = f.properties;

      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
        <div class="sidebar-item">
          <h4>${p.nombre}</h4>
          <span>Planta ${p.planta} - ${p.edificio}</span>
        </div>
      `;

      div.addEventListener("click", () => {
        const key = featureKey(f);
        window.fly(key);
      });

      searchResults.appendChild(div);
    });
  }

  function performSearch() {
    const query = searchInput.value;

    const filtered = getFilteredFeatures(); // respeta filtros
    const results = searchFeatures(query, filtered);

    renderSearchResults(results);
  }

  // Buscar al escribir (con debounce)
  let searchTimeout = null;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      performSearch();
    }, 200);
  });
  
  // ================= FLY =================
  window.featureKey = featureKey;
  
  window.fly = function(key) {
    const marker = markersByKey[key];
    if (!marker) return;

    map.flyTo(marker.getLatLng(), FLY_ZOOM);
    marker.openPopup();

    if (isMobile()) {
      sidebar.classList.remove('visible');
    }
  };
  
  // ================= GEOLOCALIZACIÓN =================
  document.getElementById('geolocate-button').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
          }
          userLocationMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:2px solid white"></div>`,
              className: 'user-location-icon'
            })
          }).addTo(map);
          map.flyTo([latitude, longitude], 18);
        },
        (error) => {
          alert("No se pudo obtener tu ubicación. Por favor, asegúrate de que la geolocalización esté activada.");
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  });
  
  // ================= UPDATE =================
  function update(){
    const feats = getFilteredFeatures();
    updateLayers(); // Mapa
    renderSidebar(feats); // Sidebar
    performSearch();
  }
  
  // ================= CAMBIO DE FILTROS =================
  setupFilters(state, update);

  update();

  // ================= Evento para detectar clicks en el mapa =================
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    let markerFound = false;

    // Comprueba si hay algún marcador en las coordenadas del click
    map.eachLayer(function(layer) {
      if (layer instanceof L.Marker) {
        const markerLatLng = layer.getLatLng();
        // Compara las coordenadas con un margen pequeño para evitar problemas de precisión
        if (
          Math.abs(markerLatLng.lat - lat) < 0.00005 &&
          Math.abs(markerLatLng.lng - lng) < 0.00005
        ) {
          markerFound = true;
        }
      }
    });

    // Si no hay marcador, muestra el popup personalizado
    if (!markerFound) {
      const popupContent = `
        <div class="popup-card">
          <h4>¿Falta algún lugar aquí?</h4>
          <p>Puedes reportarlo aquí:</p>
          <button onclick="window.open('https://docs.google.com/forms/d/e/1FAIpQLSdgbuxXkLoHbwkBDh5i6TF-OzIHC7WK_Y6LDy4tCTiSR3Sg5Q/viewform?usp=pp_url&entry.339440483=${lat}&entry.736856326=${lng}')" style="padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reportar falta de lugar
          </button>
        </div>
      `;

      L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
    }
  });
}

// ================= FLY DESDE URL =================
// Función para obtener el hash de la URL (sin el #)
function getUrlHash() {
  return window.location.hash.substring(1); // Elimina el #
}

// Al cargar la página, revisa si hay un hash en la URL
window.addEventListener('load', () => {
  const idFromHash = getUrlHash();
  if (idFromHash) {
    // Espera a que el mapa y los marcadores estén listos
    setTimeout(() => {
      window.fly(idFromHash);
    }, 500); // Espera 500 milisegundos para asegurarte de que todo esté cargado
  }
});

// ================= COMPARTIR MARCADOR =================
// Función para compartir el marcador
function shareMarker(url, title) {
  if (navigator.share) {
    // Usa la Web Share API si está disponible (móviles y algunos navegadores de escritorio)
    navigator.share({
      title: title,
      text: `Mira este lugar en el CEUCAtlas: ${title}`,
      url: url,
    })
  } else {
    // Si no está disponible, copia el enlace al portapapeles
    copyToClipboard(url);
    alert("Enlace copiado en el portapapeles.");
  }
}

// Función para copiar texto al portapapeles
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log("Enlace copiado al portapapeles");
  }).catch(err => {
    console.error("Error al copiar al portapapeles:", err);
  });
}