document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Vista por defecto (mes)
        locale: 'es', // Idioma español
        editable: false, // No permitir arrastrar eventos
    });

    calendar.render(); // Renderiza el calendario
});