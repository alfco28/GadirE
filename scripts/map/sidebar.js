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
function toggleSidebarVisibility() {
    const searchInput = document.getElementById('sidebar-search-bar');
    const searchResults = document.getElementById('sidebar-search-results');
    const sidebarContent = document.getElementById('sidebar-content');

    if (searchInput.value.trim() === '') {
        // Si el input está vacío
        searchResults.style.display = 'none';
        sidebarContent.style.display = 'block';
    } else {
        // Si el input tiene texto
        searchResults.style.display = 'block';
        sidebarContent.style.display = 'none';
    }
}

// Escuchar el evento 'input' en el buscador
const searchInput = document.getElementById('sidebar-search-bar');
if (searchInput) {
    searchInput.addEventListener('input', toggleSidebarVisibility);
}

// Llamar a la función al cargar la página para establecer el estado inicial
document.addEventListener('DOMContentLoaded', toggleSidebarVisibility);