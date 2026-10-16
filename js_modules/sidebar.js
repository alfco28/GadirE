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