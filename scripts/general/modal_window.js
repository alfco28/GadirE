// Función para abrir la modal con título y contenido personalizado
function openMW(title, content) {
    const modal = document.getElementById("modal-window");
    const modalTitle = document.getElementById("mw-title");
    const modalBody = document.getElementById("mw-body");

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Evita el scroll del fondo
}

// Función para cerrar la modal
function closeMW() {
    const modal = document.getElementById("modal-window");
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Restaura el scroll
}

// Cerrar la modal al hacer click en la 'X'
document.getElementById("mw-close").addEventListener("click", closeMW);

// Cerrar la modal al hacer click fuera del contenido
window.addEventListener("click", (event) => {
    const modal = document.getElementById("modal-window");
    if (event.target === modal) {
    closeMW();
    }
});

// Ejemplo de uso con JS
/*document.getElementById("refresh-notifications").addEventListener("click", () => {
    openMW("Título personalizado", "<p>Contenido dinámico con <button>botones</button> o imágenes.Contenido dinámico con <button>botones</button> o imágenes.Contenido dinámico con <button>botones</button> o imágenes.Contenido dinámico con <button>botones</button> o imágenes.Contenido dinámico con <button>botones</button> o imágenes.</p>");
});*/