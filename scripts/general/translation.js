// Variable global para almacenar las traducciones cargadas
let currentTranslations = {};

// Función para cargar el JSON según el idioma seleccionado
async function loadTranslations(language) {
    const response = await fetch(`/locales/${language}.json`);
    const translations = await response.json();
    currentTranslations = translations; // Guardar las traducciones cargadas
    return translations;
}

// Función para obtener una traducción por clave
function getTranslation(key) {
    return currentTranslations[key] || key; // Devuelve la traducción o la clave si no existe
}

// Función para actualizar el contenido de la página
async function changeLanguage(language) {
    const translations = await loadTranslations(language);

    // Seleccionar todos los elementos con un atributo id
    const elementsWithId = document.querySelectorAll("[id]");

    // Recorrer los elementos y actualizar su contenido si hay una traducción disponible
    elementsWithId.forEach(element => {
        const translationKey = element.id; // Usar el id como clave
        if (translations[translationKey]) {
            element.textContent = translations[translationKey];
        }
    });
    // Actualizar el título de la barra de título
    document.getElementById('title-bar').textContent = getTranslation('t-settings-title');

    appConfig.set('localeLang', language); // Guardar el idioma seleccionado en localStorage
}

// Escuchar cambios en el selector de idioma
document.getElementById("localeLang").addEventListener("change", (e) => {
    changeLanguage(e.target.value);
});

// Cargar el idioma por defecto al inicio
const savedLanguage = appConfig.get('localeLang') || 'es_es'; // Idioma por defecto: 'es_es'
changeLanguage(savedLanguage);