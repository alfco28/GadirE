// ================= RENDER SIDEBAR CONTENT =================
function setupSidebar(map, markersByKey, featureKey) {
    function renderSidebar(features){
        const cont=document.getElementById("sidebar-content");
        let html = "";

        const estructura={};

        features.forEach(f=>{
            const e=f.properties.edificio;
            const p=f.properties.planta;
            estructura[e] ??= {};
            estructura[e][p] ??= [];
            estructura[e][p].push(f);
        });

        for(const e in estructura){
            html += `<h3>${e}</h3>`;
            for(const p in estructura[e]){
            html += `<hr class="separador"><h4>Planta ${p}</h4>`;
            estructura[e][p].forEach(f => {
                html += `
                <div class="sidebar-item" onclick="fly('${featureKey(f)}')">
                    - ${f.properties.nombre}
                </div>`;
            });
            }
        }

        cont.innerHTML = html;
    }

    return { renderSidebar };
}

// ================= ALTERNAR VISIBILIDAD CONTENT/SEARCH RESULTS =================
function toggleSidebarVisib() {
    // Second tap with the sidebar already open: jump straight to the search bar
    // instead of closing it (focus also brings the keyboard up on touch devices).
    if (sidebar.classList.contains('visible')) {
        document.getElementById('sidebar-search-bar')?.focus();
        return;
    }

    hideAllScreens();
    sidebar.classList.add('visible');
    setActiveIcon(toggleSidebar);
}

// Escuchar el evento 'input' en el buscador
const searchInput = document.getElementById('sidebar-search-bar');
if (searchInput) {
    searchInput.addEventListener('input', toggleSidebarVisibility);
}

// Llamar a la función al cargar la página para establecer el estado inicial
document.addEventListener('DOMContentLoaded', toggleSidebarVisibility);

// ================= SHRINK THE LOGO WHILE THE SIDEBAR LIST IS SCROLLED =================
// Scrolling the list or the search results shrinks the sidebar logo so it takes
// up less room; back at the very top it grows to its normal size again.
const SIDEBAR_LOGO_SCROLL_THRESHOLD = 4; // px of tolerance so hairline scrolls trigger nothing.

const sidebarEl = document.getElementById('sidebar');
const sidebarBodies = [
  document.getElementById('sidebar-content'),
  document.getElementById('sidebar-search-results')
];

function updateSidebarLogoShrink() {
  // Only the visible pane decides (results while searching, the list otherwise).
  const scrolled = sidebarBodies.some(
    body => body.offsetParent !== null && body.scrollTop > SIDEBAR_LOGO_SCROLL_THRESHOLD
  );
  sidebarEl.classList.toggle('logo-shrunk', scrolled);
}

// React to scrolling in either pane (passive: the handler never calls preventDefault).
sidebarBodies.forEach(body => {
  body.addEventListener('scroll', updateSidebarLogoShrink, { passive: true });
});

// React to the pane swap too: the visible pane may sit at a different scroll position.
searchInput.addEventListener('input', updateSidebarLogoShrink);