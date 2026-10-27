function toggleSidebarVisib() {
  // Second tap with the sidebar already open: jump straight to the search bar
  // instead of closing it (focus also brings the keyboard up on touch devices).
  if (sidebar.classList.contains('visible')) {
    document.getElementById('sidebar-search-bar')?.focus();
    return;
  }

  hideAllScreens();
  sidebar.classList.add('visible');
  setActiveIcon(toggleSidebar);
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