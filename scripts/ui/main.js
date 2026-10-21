const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggle-sidebar');
const homeIcon = document.getElementById('home-icon');
const calendarIcon = document.getElementById('calendar-icon');
const notificationsIcon = document.getElementById('notifications-icon');
const settingsIcon = document.getElementById('settings-icon');
const backToHomeIcon = document.getElementById('back-to-home');
const mapIcon = document.getElementById('map-icon');

const homeScreen = document.getElementById('home-screen');
const notificationsScreen = document.getElementById('notifications-screen');
const settingsScreen = document.getElementById('settings-screen');

// Helper
function clearHomeTileFrame() {
  const frameContainer = document.getElementById('home-tile-frame-container');

  // Quitar el iframe detiene sus scripts y libera el documento cargado.
  frameContainer?.replaceChildren();
}

// Función para ocultar todas las pantallas
function hideAllScreens() {
  // El mapa también debe descargar cualquier HTML de tile que siga abierto.
  clearHomeTileFrame();

  const background = document.getElementById('fullscreen-background');
  const screens = document.querySelectorAll('.fullscreen-content');

  // Ocultar el contenido de las pantallas completas
  screens.forEach(screen => {
    screen.classList.remove('visible');
    screen.classList.add('hidden');
  });
      
  // Iniciar transición de salida del fondo
  background.classList.remove('visible');
  background.classList.add('hidden');
      
  // Remover la clase 'fullscreen' del dock y title-bar
  document.querySelector('.dock').classList.remove('fullscreen');
  document.querySelector('.title-bar').classList.remove('fullscreen');
}

// Función para actualizar el título según el icono seleccionado
function updateTitleBar(icon) {
  const titleBar = document.getElementById('title-bar');
  if (icon.id === 'toggle-sidebar') {
    titleBar.textContent = getTranslation('t-search-title');
  } else if (icon.id === 'map-icon') {
    const translatedTitle = typeof getTranslation === 'function'
      ? getTranslation('t-map-title')
      : 'Mapa';
    titleBar.textContent = translatedTitle === 't-map-title' ? 'Mapa' : translatedTitle;
  } else if (icon.id === 'home-icon') {
    titleBar.textContent = getTranslation('t-home-title');
  } else if (icon.id === 'calendar-icon') {
    titleBar.textContent = getTranslation('t-calendar-title');
  } else if (icon.id === 'notifications-icon') {
    titleBar.textContent = getTranslation('t-notifications-title');
  } else if (icon.id === 'settings-icon') {
    titleBar.textContent = getTranslation('t-settings-title');
  }
}

function refreshTitleBar() {
  const visibleScreen = document.querySelector('.fullscreen-content.visible');
  if (visibleScreen?.id === 'home-tile-screen') return;

  const iconByScreen = {
    'home-screen': 'home-icon',
    'calendar-screen': 'calendar-icon',
    'notifications-screen': 'notifications-icon',
    'settings-screen': 'settings-icon'
  };
  const activeIcon = visibleScreen
    ? document.getElementById(iconByScreen[visibleScreen.id])
    : document.querySelector('.dock-icon.active');

  if (activeIcon) updateTitleBar(activeIcon);
}

window.refreshTitleBar = refreshTitleBar;
      
// Función para establecer el icono activo y actualizar el título
function setActiveIcon(activeIcon) {
  document.querySelectorAll('.dock-icon').forEach(icon => {
    icon.classList.remove('active');
  });
  activeIcon.classList.add('active');

  if (activeIcon.id === 'map-icon' || activeIcon.id === 'toggle-sidebar') {
    document.querySelector('.dock').classList.remove('fullscreen');
    document.querySelector('.title-bar').classList.remove('fullscreen');
  }

  updateTitleBar(activeIcon);
}

function showFullscreenScreen(screen, activeIcon, title, showBackButton) {
  // Conserva el iframe solo mientras su pantalla siga siendo la activa.
  if (screen.id !== 'home-tile-screen') {
    clearHomeTileFrame();
  }

  const background = document.getElementById('fullscreen-background');
  const titleBar = document.getElementById('title-bar');

  background.classList.remove('hidden');
  background.classList.add('visible');

  // Mantiene una sola pantalla visible, incluidas las tiles personalizadas.
  document.querySelectorAll('.fullscreen-content').forEach(candidate => {
    const isActive = candidate === screen;
    candidate.classList.toggle('visible', isActive);
    candidate.classList.toggle('hidden', !isActive);
  });

  document.querySelector('.dock').classList.add('fullscreen');
  titleBar.classList.add('fullscreen');
  backToHomeIcon.hidden = !showBackButton;

  setActiveIcon(activeIcon);
  titleBar.textContent = title;
}

// Eventos para los iconos del dock
homeIcon.addEventListener('click', () => {
  showFullscreenScreen(
    homeScreen,
    homeIcon,
    getTranslation('t-home-title'),
    false
  );
});

calendarIcon.addEventListener('click', () => {
  showFullscreenScreen(
    document.getElementById('calendar-screen'),
    calendarIcon,
    getTranslation('t-calendar-title'),
    false
  );
});

notificationsIcon.addEventListener('click', () => {
  cargarFeedsSeleccionados();
  showFullscreenScreen(
    notificationsScreen,
    notificationsIcon,
    getTranslation('t-notifications-title'),
    false
  );
});

settingsIcon.addEventListener('click', () => {
  showFullscreenScreen(
    settingsScreen,
    settingsIcon,
    getTranslation('t-settings-title'),
    true
  );
});

backToHomeIcon.addEventListener('click', () => {
  // Al salir, elimina el iframe para detener su contenido JavaScript.
  document
    .getElementById('home-tile-frame-container')
    .replaceChildren();

  showFullscreenScreen(
    homeScreen,
    homeIcon,
    getTranslation('t-home-title'),
    false
  );
});

mapIcon.addEventListener('click', () => {
  hideAllScreens();
  setActiveIcon(mapIcon);
});

// Función para que home.js pueda abrir una tile a pantalla completa
window.openHomeTileScreen = function (frame, fallbackTitle) {
  const frameContainer = document.getElementById('home-tile-frame-container');
  const screen = document.getElementById('home-tile-screen');

  // Reemplaza solo el iframe anterior; conserva header y footer.
  frameContainer.replaceChildren(frame);

  showFullscreenScreen(screen, homeIcon, fallbackTitle, true);

  frame.addEventListener('load', () => {
    const htmlTitle = frame.contentDocument?.title.trim();

    if (htmlTitle && frame.parentElement === frameContainer) {
      document.getElementById('title-bar').textContent = htmlTitle;
    }
  });
};

// Página de inicio
setActiveIcon(mapIcon);