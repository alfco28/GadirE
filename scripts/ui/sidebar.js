// Sidebar
toggleSidebar.addEventListener('click', () => {
  hideAllScreens();
  sidebar.classList.toggle('visible');
  setActiveIcon(toggleSidebar);
});

// Ocultar sidebar al hacer clic en otro icono del dock
document.querySelectorAll('.dock-icon:not(#toggle-sidebar)').forEach(icon => {
  icon.addEventListener('click', () => {
    if (sidebar.classList.contains('visible')) {
      sidebar.classList.remove('visible');
    }
  });
});

// Ocultar sidebar al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('visible')) {
    sidebar.classList.remove('visible');
    setActiveIcon(mapIcon);
  }
});