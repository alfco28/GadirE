var searchControl = new L.Control.Search({
    layer: markersLayer,   // capa donde tienes los marcadores
    propertyName: 'name',  // propiedad que quieres buscar
    marker: false
});

map.addControl(searchControl);

// Opcional: ocultar la barra original
searchControl.getContainer().style.display = 'none';

document.getElementById("sidebar-search-button").addEventListener("click", function () {
    var texto = document.getElementById("sidebar-search-bar").value;
    searchControl.searchText(texto);
});

searchControl.on('search:locationfound', function(e) {
    console.log("Encontrado:", e.text, e.latlng);
});