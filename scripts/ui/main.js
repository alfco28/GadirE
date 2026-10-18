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

// Función para ocultar todas las pantallas
function hideAllScreens() {
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
    titleBar.textContent = 'Mapa'; //Hay que agregar la traducción para el título del mapa, pero deja de funcionar si se hace ¿?
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

// Eventos para los iconos del dock
homeIcon.addEventListener('click', () => {
  const background = document.getElementById('fullscreen-background');
  background.classList.remove('hidden');
  background.classList.add('visible');

  const notifications = document.getElementById('notifications-screen');
  notifications.classList.remove('visible');
  notifications.classList.add('hidden');

  const settings = document.getElementById('settings-screen');
  settings.classList.remove('visible');
  settings.classList.add('hidden');

  const home = document.getElementById('home-screen');
  home.classList.remove('hidden');
  home.classList.add('visible');
        
  setActiveIcon(homeIcon);
  document.querySelector('.dock').classList.add('fullscreen');
  document.querySelector('.title-bar').classList.add('fullscreen');
});

calendarIcon.addEventListener('click', () => {
  const background = document.getElementById('fullscreen-background');
  background.classList.remove('hidden');
  background.classList.add('visible');

  const notifications = document.getElementById('notifications-screen');
  notifications.classList.remove('visible');
  notifications.classList.add('hidden');

  const home = document.getElementById('home-screen');
  home.classList.remove('visible');
  home.classList.add('hidden');

  const settings = document.getElementById('settings-screen');
  settings.classList.remove('visible');
  settings.classList.add('hidden');

  setActiveIcon(calendarIcon);
  document.querySelector('.dock').classList.add('fullscreen');
  document.querySelector('.title-bar').classList.add('fullscreen');
});

notificationsIcon.addEventListener('click', () => {
  const background = document.getElementById('fullscreen-background');
  background.classList.remove('hidden');
  background.classList.add('visible');

  const home = document.getElementById('home-screen');
  home.classList.remove('visible');
  home.classList.add('hidden');

  const settings = document.getElementById('settings-screen');
  settings.classList.remove('visible');
  settings.classList.add('hidden');

  const notifications = document.getElementById('notifications-screen');
  notifications.classList.remove('hidden');
  notifications.classList.add('visible');
        
  setActiveIcon(notificationsIcon);
  document.querySelector('.dock').classList.add('fullscreen');
  document.querySelector('.title-bar').classList.add('fullscreen');
});

settingsIcon.addEventListener('click', () => {
  const home = document.getElementById('home-screen');
  home.classList.remove('visible');
  home.classList.add('hidden');

  const settings = document.getElementById('settings-screen');
  settings.classList.remove('hidden');
  settings.classList.add('visible');

  updateTitleBar(settingsIcon);
});

backToHomeIcon.addEventListener('click', () => {
  const settings = document.getElementById('settings-screen');
  settings.classList.remove('visible');
  settings.classList.add('hidden');

  const home = document.getElementById('home-screen');
  home.classList.remove('hidden');
  home.classList.add('visible');

  updateTitleBar(homeIcon);
});

mapIcon.addEventListener('click', () => {
  hideAllScreens();
  setActiveIcon(mapIcon);
});

// Página de inicio
setActiveIcon(mapIcon);