export function setupFilters(state, update) {
    document.getElementById("fEdificio").onchange=e=>{
        state.edificio=e.target.value;
        update();
    }
    document.getElementById("fPlanta").onchange=e=>{
        state.planta=e.target.value;
        update();
    }
    document.getElementById("fTipo").onchange=e=>{
        state.tipo=e.target.value;
        update();
    }
    document.getElementById("fCampus").onchange=e=>{
        state.campus=e.target.value;
        update();
    }
}

// ================= TOGGLE FILTERS =================
export function toggleFilters() {
    const filters = document.getElementById('filters-content');
    filters.classList.toggle('hidden');
}