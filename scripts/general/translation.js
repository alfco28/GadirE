// Función para cargar el JSON según el idioma seleccionado
async function loadTranslations(language) {
    const response = await fetch(`/locales/${language}.json`);
    const translations = await response.json();
    return translations;
}

// Función para actualizar el contenido de la página
async function changeLanguage(language) {
    const translations = await loadTranslations(language);

    document.getElementById("t-settings-personalisation-accentColour").textContent = translations["t-settings-personalisation-accentColour"];
    document.getElementById("t-settings-personalisation-accentColour-yellow").textContent = translations["t-settings-personalisation-accentColour-yellow"];
    document.getElementById("t-settings-personalisation-accentColour-blue").textContent = translations["t-settings-personalisation-accentColour-blue"];
    document.getElementById("t-settings-personalisation-accentColour-purple").textContent = translations["t-settings-personalisation-accentColour-purple"];
    document.getElementById("t-settings-personalisation-accentColour-orange").textContent = translations["t-settings-personalisation-accentColour-orange"];
    document.getElementById("t-settings-personalisation-accentColour-pink").textContent = translations["t-settings-personalisation-accentColour-pink"];
    document.getElementById("t-settings-personalisation-accentColour-turquoise").textContent = translations["t-settings-personalisation-accentColour-turquoise"];
    document.getElementById("t-settings-personalisation-accentColour-green").textContent = translations["t-settings-personalisation-accentColour-green"];
    document.getElementById("t-settings-personalisation-showZoomControls").textContent = translations["t-settings-personalisation-showZoomControls"];
    document.getElementById("t-settings-personalisation-showMyLocationButton").textContent = translations["t-settings-personalisation-showMyLocationButton"];
    document.getElementById("t-settings-personalisation-showFilters").textContent = translations["t-settings-personalisation-showFilters"];
    document.getElementById("t-settings-personalisation-landingPage").textContent = translations["t-settings-personalisation-landingPage"];
    document.getElementById("t-settings-personalisation-startingLocation").textContent = translations["t-settings-personalisation-startingLocation"];
    document.getElementById("t-settings-personalisation-language").textContent = translations["t-settings-personalisation-language"];
    document.getElementById("t-settings-notifications-title").textContent = translations["t-settings-notifications-title"];
    
    appConfig.set('localeLang', language); // Guardar el idioma seleccionado en localStorage
}

// Escuchar cambios en el selector de idioma
document.getElementById("localeLang").addEventListener("change", (e) => {
    changeLanguage(e.target.value);
});

// Cargar el idioma por defecto al inicio
const savedLanguage = appConfig.get('localeLang') || 'es_es'; // Idioma por defecto: 'es_es'
changeLanguage(savedLanguage);