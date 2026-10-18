function toggleSidebarVisib() {
  hideAllScreens();
  sidebar.classList.toggle('visible');
  if (!sidebar.classList.contains('visible')) {
    // Si el sidebar se oculta, selecciona el mapIcon como activo
    setActiveIcon(mapIcon);
  } else {
    setActiveIcon(toggleSidebar);
  }
}

// Mostrar/ocultar al hacer click en su icono
toggleSidebar.addEventListener('click', () => toggleSidebarVisib());

// Ocultar sidebar al hacer click en otro icono del dock
document.querySelectorAll('.dock-icon:not(#toggle-sidebar)').forEach(icon => {
  icon.addEventListener('click', () => {
    if (sidebar.classList.contains('visible')) {
      sidebar.classList.remove('visible');
    }
  });
});

// Ocultar sidebar al hacer click fuera
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('visible')) {
    sidebar.classList.remove('visible');
    setActiveIcon(mapIcon);
  }
});