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
const FUZZY_SEARCH_THRESHOLD = 0.4;
const SEARCH_FIELDS = [
  { name: "nombre" },
  { name: "edificio" },
  { name: "descrip" },
  { name: "campus" },
  { name: "tipo" },
  { name: "planta" },
  { name: "enlace" }
];

let searchControl = null;
let campusGeoJSON = null;
let featuresById = new Map();

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

function getSearchableText(properties) {
  // Se excluyen el id tecnico y la clase generica "espacio", que comparten todos los puntos.
  return SEARCH_FIELDS.map(({ name }) => properties[name])
    .filter(value => value !== null && value !== undefined && String(value).trim() !== "")
    .join(" ");
}

function getExactFieldPriority(feature, tokens) {
  const priority = SEARCH_FIELDS.findIndex(({ name }) => {
    const fieldTokens = tokenise(String(feature.properties[name] ?? ""));
    return tokens.some(token => fieldTokens.includes(token));
  });

  return priority === -1 ? SEARCH_FIELDS.length : priority;
}

function getFuzzyFieldPriority(result) {
  let priority = SEARCH_FIELDS.length;

  result.matches.forEach(match => {
    const fieldName = typeof match.key === "string" ? match.key : match.key.name;
    const matchPriority = SEARCH_FIELDS.findIndex(field => field.name === fieldName);
    if (matchPriority !== -1) priority = Math.min(priority, matchPriority);
  });

  return priority;
}

// Indexar texto de features
function buildSearchIndex(features) {
  features.forEach(f => {
    const tokens = tokenise(getSearchableText(f.properties));

    tokens.forEach(token => {
      if (!index.search[token]) index.search[token] = new Set();
      index.search[token].add(f);
    });
  });
}

// Índice para Fuse.js (búsqueda difusa)
let fuseIndex = null;

function buildFuseIndex(features) {
  featuresById = new Map(features.map(feature => [feature.properties.idnum, feature]));

  const searchableData = features.map(f => {
    const p = f.properties;
    return {
      id: p.idnum,
      ...Object.fromEntries(SEARCH_FIELDS.map(({ name }) => [name, p[name] ?? ""]))
    };
  });

  fuseIndex = new Fuse(searchableData, {
    keys: SEARCH_FIELDS.map(({ name }) => name),
    includeScore: true,
    includeMatches: true,
    threshold: FUZZY_SEARCH_THRESHOLD, // Umbral de similitud (0 = exacto, 1 = muy difuso)
    minMatchCharLength: 2, // Mínimo de caracteres para coincidencia
    ignoreLocation: true, // Permite coincidencias parciales aunque aparezcan al final del texto.
  });
}

// Buscar con intersección de tokens
function searchFeatures(query, baseFeatures) {
  if (!query.trim()) return baseFeatures;

  // 1. Búsqueda exacta (como antes)
  const tokens = tokenise(query);
  if (tokens.length === 0) return baseFeatures;

  let exactResults = tokens.map(t => index.search[t] || new Set());
  let exactResult = exactResults[0];
  for (let i = 1; i < exactResults.length; i++) {
    exactResult = new Set([...exactResult].filter(f => exactResults[i].has(f)));
  }

  const baseSet = new Set(baseFeatures);
  const exactFeatures = [...exactResult]
    .filter(feature => baseSet.has(feature))
    .sort((a, b) => getExactFieldPriority(a, tokens) - getExactFieldPriority(b, tokens));
  const exactFeatureSet = new Set(exactFeatures);

  // 2. Búsqueda difusa (Fuse.js), ordenada por campo y luego por similitud.
  let fuzzyFeatures = [];
  try {
    if (fuseIndex) {
      // Descarta candidatos cuyo score supera el umbral para evitar falsos positivos.
      const fuzzyResults = fuseIndex.search(query)
        .filter(result => result.score <= FUZZY_SEARCH_THRESHOLD)
        .sort((a, b) => getFuzzyFieldPriority(a) - getFuzzyFieldPriority(b) || a.score - b.score);
      fuzzyFeatures = fuzzyResults
        .map(result => featuresById.get(result.item.id))
        .filter(feature => feature && baseSet.has(feature) && !exactFeatureSet.has(feature));
    }
  } catch (e) {
    console.error("Error en búsqueda difusa:", e);
    // Si Fuse falla, fuzzyFeatures sigue vacío y se conservan los resultados exactos.
  }

  // 3. Los exactos se mantienen delante de los difusos.
  return [...exactFeatures, ...fuzzyFeatures];
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
        <div class="popup-header">
          <h4>${p.nombre}</h4>
          <button
              id="${buttonId}"
              class="popup-action-button"
              type="button"
              aria-label="Compartir ${p.nombre}"
              title="Compartir">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
          </button>
        </div>
        <p class="popup-description">${p.descrip}</p>
        <div class="popup-meta">
          <div class="popup-meta-row">
            <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
            <span>Planta ${p.planta}</span>
          </div>
          <div class="popup-meta-row">
            <i class="fa-solid fa-building" aria-hidden="true"></i>
            <span>${p.edificio}</span>
          </div>
          <div class="popup-meta-row">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span>${p.campus}</span>
          </div>
        </div>
        <div class="popup-footer">
          <span class="popup-id">#${p.idnum}</span>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdEZjtvKMVmpLC3zcajTqxQdqtVs6yuITLAooP6FPez8nhKoQ/viewform?usp=pp_url&entry.2020790469=${p.idnum}" 
              class="popup-action-button popup-report-link"
              aria-label="Reportar un error en ${p.nombre}"
              title="Reportar un error"
              target="_blank"
              rel="noopener noreferrer">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
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
  buildFuseIndex(campusGeoJSON.features)
  initMap();
}

function initMap() {
  const map = L.map('map', {
    zoomControl: false,
    maxZoom: 19 // Real deepest zoom: aligns with FLY_ZOOM, blocks the grey zone past the tile layer, and lets the cluster plugin detect the true max zoom for spiderfy.
  }).setView([36.5297, -6.2118], 16);

  /* //Ahora CARTO requiere API key
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom:20, attribution: 'Map data from <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>. © <a href="https://carto.com/about-carto/">rastertiles/voyager</a>'
    }
  ).addTo(map);
  */

  const baseLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19.85, // Si se pone maxZoom:20, las teselas se vuelven grises al hacer zoom al máximo
    attribution: '&copy; Map data from <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>.',
    keepBuffer: 4 // Retains already-loaded tiles around the view so panning back is instant.
  }
  ).addTo(map);

  // ================= TILE PREFETCH =================
  // Warms the browser HTTP cache with tiles around the visible view (pan) and
  // one zoom level ahead (zoom), so small movements render without grey gaps.
  const PREFETCH_RING = 1; // Tile rows/columns warmed around the view.

  // Fetches a single tile into the browser cache; Leaflet will later serve it instantly.
  function warmTile(x, y, z) {
    const count = 2 ** z;
    x = ((x % count) + count) % count; // Horizontal wrap, like Leaflet's own tiles.
    if (y < 0 || y >= count) return;   // Vertical tiles do not wrap: skip.
    const img = new Image();
    img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  // Tile range covering the current view at an integer zoom level.
  function tileRangeAt(zoom) {
    const bounds = map.getBounds();
    const southWest = map.project(bounds.getSouthWest(), zoom);
    const northEast = map.project(bounds.getNorthEast(), zoom);
    return {
      minX: Math.floor(southWest.x / 256),
      maxX: Math.floor(northEast.x / 256),
      minY: Math.floor(northEast.y / 256), // North is the top edge (smaller y).
      maxY: Math.floor(southWest.y / 256)
    };
  }

  function prefetchTiles() {
    const layerMax = Math.floor(baseLayer.options.maxZoom); // 19.85 -> 19: the deepest level OSM actually serves.
    const zoom = Math.min(Math.round(map.getZoom()), layerMax);

    // 1) Pan warm-up: ring of tiles just outside the visible range.
    const view = tileRangeAt(zoom);
    for (let x = view.minX - PREFETCH_RING; x <= view.maxX + PREFETCH_RING; x++) {
      for (let y = view.minY - PREFETCH_RING; y <= view.maxY + PREFETCH_RING; y++) {
        // Visible tiles are skipped: Leaflet already loads those.
        if (x >= view.minX && x <= view.maxX && y >= view.minY && y <= view.maxY) continue;
        warmTile(x, y, zoom);
      }
    }

    // 2) Zoom-in warm-up: 4x4 block at zoom+1 around the view centre.
    if (zoom < layerMax) {
      const centre = map.project(map.getCenter(), zoom + 1).divideBy(256).floor();
      for (let dx = -1; dx <= 2; dx++) {
        for (let dy = -1; dy <= 2; dy++) {
          warmTile(centre.x + dx, centre.y + dy, zoom + 1);
        }
      }
    }

    // 3) Zoom-out warm-up: parents of the current view plus one ring, one level up.
    if (zoom > 0) {
      const parent = tileRangeAt(zoom - 1);
      for (let x = parent.minX - 1; x <= parent.maxX + 1; x++) {
        for (let y = parent.minY - 1; y <= parent.maxY + 1; y++) {
          warmTile(x, y, zoom - 1);
        }
      }
    }
  }

  map.on('moveend', prefetchTiles);

  // ================= CLUSTER GLOBAL DE MARCADORES =================
  // All markers live in a single cluster group, so points of different types
  // in the same area merge into one cluster (decision by Alfonso, 27-10-2026).
  // Known types: markers with an unknown type are skipped, like the old per-type layers did.
  const KNOWN_TIPOS = new Set([
    'descanso', 'aseo', 'aula', 'biblio', 'cafete', 'despacho',
    'lab', 'repre', 'salon', 'transporte', 'unidad', 'emergencia'
  ]);

  // Cluster icon: a pie chart with the colours of the types it contains, plus the total count.
  // COLOURS is declared further below: that is fine, this runs only when the map renders.
  function clusterIcon(cluster) {
    const markers = cluster.getAllChildMarkers();
    const total = markers.length;
    const counts = {};
    markers.forEach(marker => {
      const tipo = marker.feature?.properties?.tipo;
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    // Build the pie slices as a conic-gradient from the running proportions.
    let accumulated = 0;
    const slices = Object.entries(counts).map(([tipo, n]) => {
      const start = (accumulated / total) * 360;
      accumulated += n;
      const end = (accumulated / total) * 360;
      return `${COLOURS[tipo] || '#6b7280'} ${start}deg ${end}deg`;
    });

    return L.divIcon({
      className: 'gadire-cluster-icon', // Replaces the default 'leaflet-div-icon' box, same idea as gadire-map-marker.
      html: `<div class="gadire-cluster" style="background: conic-gradient(${slices.join(', ')})" role="img" aria-label="${total} lugares"><span>${total}</span></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  const clusterGroup = L.markerClusterGroup({
    // Clustering runs at EVERY zoom level (up to the map's maxZoom, 19), so points
    // that stay visually superimposed at max zoom keep clustering and clicking
    // their cluster fans them out with legs (spiderfy).
    maxClusterRadius: (zoom) => zoom >= 17 ? 24 : 80, // 80 px: groups buildings at far zooms; 24 px: only overlapping dots at close zooms.
    showCoverageOnHover: false,  // Do not draw the cluster bounds polygon on hover.
    spiderfyOnMaxZoom: true,     // Clicking a tight cluster at max zoom fans its points out with legs (plugin default, made explicit).
    iconCreateFunction: clusterIcon
  });
  clusterGroup.addTo(map);
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
    unidad: "#334155",
    emergencia: "#db2777"
  };

  function icon(tipo){
    const colour = COLOURS[tipo] || "#6b7280";
    return L.divIcon({
      className: 'gadire-map-marker', // Replaces Leaflet's default 'leaflet-div-icon' class, whose white background and grey border drew the little square behind each dot.
      html: `<div style="background:${colour};width:14px;height:14px;border-radius:50%"></div>`,
      iconSize: [14, 14], // Container matches the dot size...
      iconAnchor: [7, 7]  // ...so the dot sits exactly centred on the feature coordinates.
    });
  }

  const markersByKey = {};

  campusGeoJSON.features.forEach(f => {
    const tipo = f.properties.tipo;
    if (!KNOWN_TIPOS.has(tipo)) return;

    const marker = L.marker(
      [f.geometry.coordinates[1], f.geometry.coordinates[0]],
      {
        title: `${f.properties.nombre}, ${f.properties.edificio}`,
        icon: icon(tipo)
      }
    ).bindPopup(popupHTML(f.properties), {
      className: 'gadire-map-popup',
      closeOnClick: true,
      maxWidth: 360,
      minWidth: 230,
      autoPanPaddingTopLeft: [20, 50],
      autoPanPaddingBottomRight: [20, 175]
    });
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

    clusterGroup.addLayer(marker);
    const key = featureKey(f);
    markersByKey[key] = marker;
  });

  // =============== MARCADORES VISIBLES EN EL MAPA ===============
  function updateLayers(features) {
    // Se reutilizan los resultados ya calculados y solo se alterna la pertenencia de cada
    // marcador al grupo de clustering; el plugin re-agrupa solos los que quedan dentro.
    const visibles = new Set(features);

    Object.values(markersByKey).forEach(marker => {
      if (visibles.has(marker.feature)) clusterGroup.addLayer(marker);
      else clusterGroup.removeLayer(marker);
    });
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
      div.className = "sidebar-item";
      div.innerHTML = `
        <h4>${p.nombre}</h4>
        <span>Planta ${p.planta} - ${p.edificio}</span>
      `;

      div.addEventListener("click", () => {
        const key = featureKey(f);
        window.fly(key);
      });

      searchResults.appendChild(div);
    });
  }

  function performSearch(filtered = getFilteredFeatures()) {
    const query = searchInput.value;

    const results = searchFeatures(query, filtered);

    renderSearchResults(results);
    updateLayers(results);
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

    if (clusterGroup.getVisibleParent(marker) === marker) {
      // Already on screen: the same flight as always (z19 is beyond the clustering threshold).
      map.flyTo(marker.getLatLng(), FLY_ZOOM);
      marker.openPopup();
    } else {
      // Hidden inside a cluster: the plugin reveals it (zooms in or fans it out), then opens the popup.
      clusterGroup.zoomToShowLayer(marker, () => marker.openPopup());
    }

    if (isMobile()) {
      sidebar.classList.remove('visible');
    }
  };
  
  // ================= GEOLOCALIZACIÓN =================
  const geolocateButton = document.getElementById('geolocate-button');
  let locationWatchId = null;
  let isFollowingLocation = false;
  let hasCenteredOnUser = false;
  let isOrientationListening = false;
  let deviceHeading = null;

  const userLocationIcon = L.divIcon({
    className: 'user-location-icon',
    html: '<span class="user-location-direction"></span><span class="user-location-dot"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  function updateGeolocateButtonLabel() {
    const key = isFollowingLocation
      ? 't-map-stop-following-location'
      : 't-map-follow-location';
    const fallback = isFollowingLocation
      ? 'Dejar de seguir mi ubicación'
      : 'Seguir mi ubicación';
    const translated = typeof getTranslation === 'function' ? getTranslation(key) : key;
    const label = translated === key ? fallback : translated;

    geolocateButton.setAttribute('aria-label', label);
    geolocateButton.setAttribute('aria-pressed', String(isFollowingLocation));
    geolocateButton.title = label;
    geolocateButton.classList.toggle('is-tracking', isFollowingLocation);
  }

  window.updateGeolocateButtonLabel = updateGeolocateButtonLabel;

  function setUserLocationHeading(heading) {
    const markerElement = userLocationMarker?.getElement();
    if (!markerElement) return;

    if (!Number.isFinite(heading) || heading < 0) {
      markerElement.classList.remove('has-heading');
      return;
    }

    const normalisedHeading = ((heading % 360) + 360) % 360;
    markerElement.style.setProperty('--location-heading', `${normalisedHeading}deg`);
    markerElement.classList.add('has-heading');
  }

  function handleDeviceOrientation(event) {
    let heading = event.webkitCompassHeading;

    if (!Number.isFinite(heading) && event.absolute && Number.isFinite(event.alpha)) {
      const screenAngle = window.screen.orientation?.angle || 0;
      heading = 360 - event.alpha + screenAngle;
    }

    if (Number.isFinite(heading)) {
      deviceHeading = heading;
      setUserLocationHeading(heading);
    }
  }

  function startOrientationTracking() {
    const orientationApi = window.DeviceOrientationEvent;
    if (!orientationApi || isOrientationListening) return;

    const listenForOrientation = () => {
      if (!isFollowingLocation || isOrientationListening) return;

      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
      isOrientationListening = true;
    };

    if (typeof orientationApi.requestPermission !== 'function') {
      listenForOrientation();
      return;
    }

    try {
      orientationApi.requestPermission()
        .then(permission => {
          if (permission === 'granted') listenForOrientation();
        })
        .catch(() => {});
    } catch (error) {
      console.warn('No se pudo activar la orientación del dispositivo:', error);
    }
  }

  function stopOrientationTracking() {
    if (!isOrientationListening) return;

    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    isOrientationListening = false;
  }

  function stopLocationTracking() {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }

    isFollowingLocation = false;
    stopOrientationTracking();
    updateGeolocateButtonLabel();
  }

  function updateUserLocation(position) {
    if (!isFollowingLocation) return;

    const { latitude, longitude, heading } = position.coords;
    const coordinates = [latitude, longitude];

    if (!userLocationMarker) {
      userLocationMarker = L.marker(coordinates, { icon: userLocationIcon }).addTo(map);
    } else {
      userLocationMarker.setLatLng(coordinates);
    }

    if (!hasCenteredOnUser) {
      map.flyTo(coordinates, 18);
      hasCenteredOnUser = true;
    } else {
      map.panTo(coordinates, { animate: true });
    }

    // GPS heading representa el rumbo de movimiento y sirve como fallback al compas.
    if (deviceHeading === null && Number.isFinite(heading) && heading >= 0) {
      setUserLocationHeading(heading);
    }
  }

  function handleLocationError(error) {
    if (!isFollowingLocation) return;

    stopLocationTracking();
    alert("No se pudo obtener tu ubicación. Por favor, asegúrate de que la geolocalización esté activada.");
  }

  // ================= REPORT FROM MY LOCATION (long press) =================
  // Holding the geolocate button down offers to report a missing place at
  // the user's current coordinates (live tracking fix if available, one-shot
  // fix otherwise). A short tap still toggles tracking.
  const LONG_PRESS_MS = 600;          // Hold time that counts as a long press.
  const LONG_PRESS_TOLERANCE_PX = 10; // Small drift allowed before the press cancels.
  let longPressTimer = null;
  let longPressStart = null;
  let longPressFired = false;

  function cancelLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressStart = null;
  }

  function offerReportAtLocation(lat, lng) {
    // Ask before opening the form; the OK click is what authorises the new tab.
    const message = `¿Quieres reportar un lugar que falta en tu ubicación actual (${lat.toFixed(5)}, ${lng.toFixed(5)})?`;
    if (confirm(message)) {
      window.open(`https://docs.google.com/forms/d/e/1FAIpQLSdgbuxXkLoHbwkBDh5i6TF-OzIHC7WK_Y6LDy4tCTiSR3Sg5Q/viewform?usp=pp_url&entry.339440483=${lat}&entry.736856326=${lng}`);
    }
  }

  function reportCurrentLocation() {
    // While tracking, reuse the live marker position; no extra GPS request.
    if (isFollowingLocation && userLocationMarker) {
      const { lat, lng } = userLocationMarker.getLatLng();
      offerReportAtLocation(lat, lng);
      return;
    }

    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => offerReportAtLocation(position.coords.latitude, position.coords.longitude),
      () => alert("No se pudo obtener tu ubicación. Por favor, asegúrate de que la geolocalización esté activada."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  geolocateButton.addEventListener('pointerdown', (event) => {
    longPressFired = false;
    longPressStart = { x: event.clientX, y: event.clientY };
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      longPressFired = true;
      reportCurrentLocation();
    }, LONG_PRESS_MS);
  });

  geolocateButton.addEventListener('pointermove', (event) => {
    if (!longPressStart) return;
    // A real move cancels the press; a tiny drift is tolerated.
    if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > LONG_PRESS_TOLERANCE_PX) {
      cancelLongPress();
    }
  });

  geolocateButton.addEventListener('pointerup', cancelLongPress);
  geolocateButton.addEventListener('pointercancel', cancelLongPress);
  geolocateButton.addEventListener('pointerleave', cancelLongPress);

  // Mobile browsers may raise a context menu on a held touch: this hold is
  // a gesture of its own.
  geolocateButton.addEventListener('contextmenu', (event) => event.preventDefault());

  geolocateButton.addEventListener('click', () => {
    if (longPressFired) {
      // The long press just handled the gesture: do not toggle tracking.
      longPressFired = false;
      return;
    }

    if (isFollowingLocation) {
      stopLocationTracking();
      return;
    }

    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    isFollowingLocation = true;
    hasCenteredOnUser = false;
    deviceHeading = null;
    setUserLocationHeading(null);
    updateGeolocateButtonLabel();
    startOrientationTracking();

    locationWatchId = navigator.geolocation.watchPosition(
      updateUserLocation,
      handleLocationError,
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  });

  window.addEventListener('pagehide', stopLocationTracking, { once: true });
  
  // ================= UPDATE =================
  function update(){
    const feats = getFilteredFeatures();
    renderSidebar(feats); // Sidebar
    performSearch(feats);
  }
  
  // ================= CAMBIO DE FILTROS =================
  setupFilters(state, update);

  update();

  // ================= Evento para detectar clicks en el mapa =================
  let popupIsOpen = false;
  let popupWasOpenBeforeMapClick = false;

  // Spiderfy state mirrored from the plugin's own events: a map click that
  // closes an open spiderfy must not also open the report popup. The plugin's
  // 'unspiderfied' event lands ~200 ms after the closing click (leg folding
  // animation), so the live flag is snapshotted in 'preclick' first.
  let spiderfyOpen = false;
  clusterGroup.on('spiderfied', () => { spiderfyOpen = true; });
  clusterGroup.on('unspiderfied', () => { spiderfyOpen = false; });
  let spiderfyWasOpenBeforeMapClick = false;

  map.on('popupopen', () => {
    popupIsOpen = true;
  });
  map.on('popupclose', () => {
    popupIsOpen = false;
  });

  // Leaflet cierra el popup durante el click; preclick conserva el estado previo.
  map.on('preclick', () => {
    popupWasOpenBeforeMapClick = popupIsOpen;
    spiderfyWasOpenBeforeMapClick = spiderfyOpen;
  });

  map.on('click', function(e) {
    if (popupWasOpenBeforeMapClick) {
      popupWasOpenBeforeMapClick = false;
      return;
    }

    // This click just folds the spiderfy legs back: it should do nothing else.
    if (spiderfyWasOpenBeforeMapClick) {
      spiderfyWasOpenBeforeMapClick = false;
      return;
    }

    if (!document.getElementById("filter-options-popup").hidden) return;

    const { lat, lng } = e.latlng;
    let markerFound = false;

    // Comprueba si hay algún marcador en las coordenadas del click.
    // Los marcadores viven dentro del grupo de clustering (ya no son capas directas del
    // mapa), así que hay que recorrer también sus miembros, además de las capas del mapa
    // (los clusters y el marcador de ubicación siguen siendo hijos directos).
    const checkLayer = function(layer) {
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
    };
    map.eachLayer(checkLayer);
    clusterGroup.eachLayer(checkLayer);

    // Si no hay marcador, muestra el popup personalizado
    if (!markerFound) {
      const popupContent = `
        <div class="popup-card popup-report-card">
          <h4>¿Falta algún lugar aquí?</h4>
          <p>Puedes reportarlo aquí:</p>
          <button class="popup-report-action" onclick="window.open('https://docs.google.com/forms/d/e/1FAIpQLSdgbuxXkLoHbwkBDh5i6TF-OzIHC7WK_Y6LDy4tCTiSR3Sg5Q/viewform?usp=pp_url&entry.339440483=${lat}&entry.736856326=${lng}')">
            Reportar falta de lugar
          </button>
        </div>
      `;

      L.popup({
        className: 'gadire-map-popup',
        closeOnClick: true,
        maxWidth: 360,
        minWidth: 230,
        autoPanPaddingTopLeft: [20, 50],
        autoPanPaddingBottomRight: [20, 175]
      })
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
    }
  });
}

// ================= BUSCAR CON COMMAND + K =================
// Escucha el evento 'keydown' en todo el documento
document.addEventListener('keydown', function(event) {
  // Comprueba si se ha pulsado Command + K o Control + K
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault(); // Evita que el navegador ejecute su comportamiento por defecto

    // Mostrar el sidebar si está oculto
    if (!document.getElementById('sidebar').classList.contains('visible')) {
      toggleSidebarVisib();
    }

    // Selecciona el input de búsqueda y enfócate en él
    const searchInput = document.getElementById('sidebar-search-bar');
    if (searchInput) {
      searchInput.focus();
      searchInput.select(); // Opcional: selecciona todo el texto existente
    }
  }
});

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
      text: `Mira este lugar en GadirE: ${title}`,
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
    console.error("Error al copiar al portapapeles: ", err);
  });
}