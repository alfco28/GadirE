// ================= INDEXACIÓN =================
const index = {
  campus: {},
  edificio: {},
  planta: {},
  tipo: {},
  all: new Set()
};

// ================= ESTADO =================
const state = {
  edificio: "todos",
  planta: "todas",
  tipo: "todos",
  campus: "todos"
};

// =============== CONSTANTES GLOBALES ===============
const SIDEBAR_ANIMATION_MS = 310;
const MOBILE_BREAKPOINT = 768;
const DEFAULT_ZOOM = 16;
const FLY_ZOOM = 19;

let searchControl = null;
let campusGeoJSON = null;

// ================= CARGAR GEOJSON =================
fetch('map_data.geojson')
  .then(response => response.json())
  .then(data => processGeoJSON(data))
  .catch(error => console.error('Error al cargar el archivo GeoJSON:', error));

// ================= IMPORTAR FUNCIONES =================
import { setupSidebar } from './js_modules/sidebar.js';
import { setupFilters } from './js_modules/filter_change.js';

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

  initMap();
}

function initMap() {
  // ================= MAPA =================
  const map = L.map('map', {
    zoomControl: false,
  }).setView([36.5298, -6.2035], DEFAULT_ZOOM);

  // Añade el control de zoom en la esquina inferior derecha
  L.control.zoom({
    position: 'bottomright',
    zoomInText: '+',
    zoomInTitle: 'Acercar',
    zoomOutText: '-',
    zoomOutTitle: 'Alejar'
  }).addTo(map);

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
  const COLORS = {
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
    const color = COLORS[tipo] || "#6b7280";
    return L.divIcon({
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%"></div>`
    });
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
    return `
        <div class="popup-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4>${p.nombre}</h4>
            <span style="color: #A0A0A0; font-size: 10px;">#${p.idnum}</span>
          </div>
          <p>${p.descrip}</p>
          Planta ${p.planta}<br>
          Edificio: ${p.edificio}<br>
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
  function rebuildSearch(features) {
    if (searchControl) {
      map.removeControl(searchControl);

      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();

      searchControl = null;
    }

    const searchLayer = L.layerGroup();

    features.forEach(f => {
      const marker = markersByKey[featureKey(f)];
      if (marker) searchLayer.addLayer(marker);
    });

    searchControl = new L.Control.Search({
      layer: searchLayer,
      propertyName: 'title',
      zoom: FLY_ZOOM,
      marker: false,
      textPlaceholder: 'Buscar...'
    });

    searchControl.on('search:locationfound', e => {
      e.layer.openPopup();
    });

    map.addControl(searchControl);
  }
  
  // ================= HELPER =================
  function isMobile() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }
  
  // ================= FLY =================
  window.featureKey = featureKey;
  
  window.fly = function(key) {
    const marker = markersByKey[key];
    if (!marker) return;

    map.flyTo(marker.getLatLng(), FLY_ZOOM);
    marker.openPopup();

    if (isMobile()) {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('toggle-sidebar');

      if (!sidebar.classList.contains('hidden')) {
        sidebar.classList.add('hidden');
        toggleButton.classList.remove('hide-when-sidebar-visible');
        setTimeout(() => map.invalidateSize(), SIDEBAR_ANIMATION_MS);
      }
    }
  };
  
  // ================= GEOLOCALIZACIÓN =================
  document.getElementById('geolocate').addEventListener('click', () => {
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
  
  // ================= ORIENTACIÓN =================
  function handleOrientation(event) {
    if (!event.alpha) return;
    const compass = document.getElementById('compass');
    compass.style.display = 'flex';
    compass.style.transform = `rotate(${event.alpha}deg)`;
  }
  
  window.addEventListener('deviceorientation', handleOrientation, true);
  
  // ================= UPDATE =================
  function update(){
    const feats = getFilteredFeatures();
    updateLayers(); // Mapa
    renderSidebar(feats); // Sidebar
    rebuildSearch(feats); // Capa de búsqueda
  }
  
  // ================= CAMBIO DE FILTROS =================
  setupFilters(state, update);

  update();
  
  // Al cargar la página, verifica el estado inicial del sidebar
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('toggle-sidebar');

  if (!sidebar.classList.contains('hidden')) {
    toggleButton.classList.add('hide-when-sidebar-visible');
  }

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
  
  // ================= AJUSTE MAPA EN MÓVILES =================
  
  // Cuando cambia el tamaño de la pantalla (rotar móvil, barras del navegador, etc.)
  window.addEventListener('resize', () => {
    map.invalidateSize();
  });
  
  // Al cargar la página (muy importante en móviles)
  window.addEventListener('load', () => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  });
  
}

// ================= TOGGLE SIDEBAR =================
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('toggle-sidebar');

  sidebar.classList.toggle('hidden');

  // Si el sidebar está oculto, muestra el botón; si no, ocúltalo
  if (sidebar.classList.contains('hidden')) {
    toggleButton.classList.remove('hide-when-sidebar-visible');
  } else {
    toggleButton.classList.add('hide-when-sidebar-visible');
  }

  // Espera a que termine la animación del sidebar
  setTimeout(() => {
    map.invalidateSize();
  }, SIDEBAR_ANIMATION_MS);
});

// Evento para el botón de cerrar el sidebar
document.getElementById('close-sidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('toggle-sidebar');

  sidebar.classList.add('hidden');
  toggleButton.classList.remove('hide-when-sidebar-visible');

  // Espera a que termine la animación del sidebar
  setTimeout(() => {
    map.invalidateSize();
  }, SIDEBAR_ANIMATION_MS);
});

// ================= MOSTRAR/OCULTAR FILTROS =================
document.getElementById('toggle-filters').addEventListener('click', () => {
  const filters = document.getElementById('filters-content');
  filters.classList.toggle('hidden');
});

// ============= CARGA DE LIBRERÍAS EXTERNAS ==========
function loadExternalScripts(callback) {
  // Contador para saber cuándo todos los scripts están cargados
  let loadedCount = 0;
  const totalScripts = 5; // Leaflet CSS, Leaflet JS, Leaflet Search CSS, Leaflet Search JS, Font Awesome

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

  // Cargar Font Awesome
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
  fontAwesome.onload = checkAllLoaded;
  document.head.appendChild(fontAwesome);
}

// ================ COOKIES ======================
let cookieButton = false;

document.addEventListener('DOMContentLoaded', function() {
  const cookieModal = document.getElementById('cookie-consent-modal');
  const acceptButton = document.getElementById('accept-cookies');
  const rejectButton = document.getElementById('reject-cookies');

  // Mostrar la ventana emergente si no hay consentimiento guardado
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    cookieModal.style.display = 'flex';
  } else if (consent === 'accepted') {
    document.querySelectorAll('.text').forEach(el => {
      el.style.display = 'none';
    });
    loadExternalScripts(processGeoJSON);
  }

  // Función para manejar el consentimiento
  function handleConsent(consent) {
    cookieModal.style.display = 'none';

    if (consent === 'accepted') {
      localStorage.setItem('cookieConsent', consent);
      document.querySelectorAll('.text').forEach(el => {
        el.style.display = 'none';
      });
      loadExternalScripts(() => {
        fetch('map_data.geojson')
          .then(response => response.json())
          .then(data => processGeoJSON(data))
          .catch(error => console.error('Error al cargar el archivo GeoJSON:', error));
      });
    } else if (consent == 'rejected' && cookieButton) {
      window.location.reload();
    }
  }

  // Eventos para los botones
  acceptButton.addEventListener('click', () => handleConsent('accepted'));
  rejectButton.addEventListener('click', () => handleConsent('rejected'));
});

// Botón para volver a configurar las cookies
document.querySelector('.back-to-cookies-button').addEventListener('click', () => {
  cookieButton = true;
  localStorage.removeItem('cookieConsent');
  const cookieModal = document.getElementById('cookie-consent-modal');
  cookieModal.style.display = 'flex';
});

// Función para obtener la ubicación y redirigir al enlace personalizado
function reportarConUbicacion() {
  const mensajeConfirmacion = "Con esta función puedes reportar la falta de un lugar usando las coordenadas de donde te encuentras ahora mismo.";

  // Mostrar el mensaje al usuario pidiendo confirmación
  if (!confirm(mensajeConfirmacion)) {
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Construye el enlace con las coordenadas
        const url = `https://docs.google.com/forms/d/e/1FAIpQLSdgbuxXkLoHbwkBDh5i6TF-OzIHC7WK_Y6LDy4tCTiSR3Sg5Q/viewform?usp=pp_url&entry.339440483=${latitude}&entry.736856326=${longitude}`;
        // Redirige al usuario
        window.location.href = url;
      },
      (error) => {
        alert("No se pudo obtener tu ubicación. Asegúrate de que la geolocalización esté activada.");
      }
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

// Asignar el evento al botón "Reportar falta de lugar"
document.getElementById("report").addEventListener("click", reportarConUbicacion);