// ================= RENDER SIDEBAR =================
export function setupSidebar(map, markersByKey, featureKey) {
    function renderSidebar(features){
        const cont=document.getElementById("sidebarContent");
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
            html += `<h4>Planta ${p}</h4>`;
            estructura[e][p].forEach(f => {
                html += `
                <div class="sidebar-item" onclick="fly('${featureKey(f)}')">
                    • ${f.properties.nombre}
                </div>`;
            });
            }
        }

        cont.innerHTML = html;
    }

    return { renderSidebar };
}

// ================= TOGGLE SIDEBAR =================
export function toggleSidebar() {
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
}

// ================= CLOSE SIDEBAR =================
export function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-sidebar');

    sidebar.classList.add('hidden');
    toggleButton.classList.remove('hide-when-sidebar-visible');

    // Espera a que termine la animación del sidebar
    setTimeout(() => {
    map.invalidateSize();
    }, SIDEBAR_ANIMATION_MS);
}