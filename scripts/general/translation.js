// Función para cargar el JSON según el idioma seleccionado
async function loadTranslations(language) {
    const response = await fetch(`/locales/${language}.json`);
    const translations = await response.json();
    return translations;
}

// Función para actualizar el contenido de la página
async function changeLanguage(language) {
    const translations = await loadTranslations(language);
    document.getElementById("notifications-settings-title").textContent = translations["notifications-settings-title"];
    appConfig.set('localeLang', language); // Guardar el idioma seleccionado en localStorage
}

// Escuchar cambios en el selector de idioma
document.getElementById("localeLang").addEventListener("change", (e) => {
    changeLanguage(e.target.value);
});

// Cargar el idioma por defecto al inicio
const savedLanguage = appConfig.get('localeLang') || 'es_es'; // Idioma por defecto: 'es_es'
changeLanguage(savedLanguage);