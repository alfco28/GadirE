// Función para abrir la modal con título y contenido personalizado
function openMW(title, content) {
    const modal = document.getElementById("modal-window");
    const modalTitle = document.getElementById("mw-title");
    const modalBody = document.getElementById("mw-body");

    modalTitle.textContent = title;
    modalBody.replaceChildren();

    if (content instanceof Node) {
        modalBody.appendChild(content);
    } else {
        modalBody.innerHTML = content;
    }

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

// Función para cerrar la modal
function closeMW() {
    const modal = document.getElementById("modal-window");

    modal.style.display = "none";
    document.body.style.overflow = "auto";
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

// PARA SUSCRIPCIÓN A CALENDARIOS Y A TEMAS
// Para conservar los EventListeners
const calendarSubscription = document.getElementById(
    "t-settings-calendar-calendarSubscription"
);

const calendarOptions = document.getElementById("calendar-options");

const topicSubscription = document.getElementById(
    "t-settings-notifications-topicSubscription"
);

const feedOptions = document.getElementById("feed-options");

// Evita que aparezcan fuera de la modal al cargar la página
document.getElementById("mw-body").append(calendarOptions, feedOptions);

calendarSubscription.addEventListener("click", () => {
    openMW(calendarSubscription.textContent.trim(), calendarOptions);
});

topicSubscription.addEventListener("click", () => {
    openMW(topicSubscription.textContent.trim(), feedOptions);
});

// PARA CONFIGURACIÓN > SOBRE GADIRE
async function openMarkdownDocumentModal(trigger, filePath) {
    const response = await fetch(filePath);
    const markdown = await response.text();

    const content = document.createElement("article");
    content.className = "markdown-content";
    content.innerHTML = marked.parse(markdown);

    openMW(trigger.textContent.trim(), content);
}

const gadireTrigger = document.getElementById(
    "t-settings-aboutGadirE-GadirE"
);

const softwareTrigger = document.getElementById(
    "t-settings-aboutGadirE-software"
);

const contributeTrigger = document.getElementById(
    "t-settings-aboutGadirE-contribute"
);

gadireTrigger.addEventListener("click", () => {
    openMarkdownDocumentModal(gadireTrigger, "/README.md");
});

softwareTrigger.addEventListener("click", () => {
    openMarkdownDocumentModal(softwareTrigger, "/LICENSE");
});

contributeTrigger.addEventListener("click", () => {
    openMarkdownDocumentModal(contributeTrigger, "/CONTRIBUTING.md");
});