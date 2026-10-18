
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedCalendars = {}; // Objeto para almacenar eventos por URL de calendario

    // Inicializar FullCalendar
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        editable: false,
        events: [], // Eventos iniciales (vacío)
    });

    calendar.render();

    // Función para parsear ICS y obtener eventos
    function parseICS(icsData) {
        const jcalData = ICAL.parse(icsData);
        const vcalendar = new ICAL.Component(jcalData);
        const events = vcalendar.getAllSubcomponents('vevent');
        return events.map(event => {
            const e = new ICAL.Event(event);
            return {
                title: e.summary,
                start: e.startDate.toJSDate(),
                end: e.endDate ? e.endDate.toJSDate() : null,
                allDay: e.startDate.isDate,
                // Añadir un identificador único para el evento (por ejemplo, UID del ICS)
                id: e.uid || Math.random().toString(36).substring(2, 15),
            };
        });
    }

    // Función para cargar eventos desde una URL de calendario (ICS)
    function loadCalendar(url) {
        fetch(url)
            .then(response => response.text())
            .then(icsData => {
                const events = parseICS(icsData);
                console.log("Eventos parseados:", events); // Verifica que haya eventos
                selectedCalendars[url] = events; // Guardar eventos por URL
                calendar.addEventSource(events);
            })
            .catch(error => console.error("Error al cargar el calendario:", error));
    }

    // Función para eliminar eventos de un calendario
    function removeCalendar(url) {
        if (selectedCalendars[url]) {
            // Obtener los IDs de los eventos del calendario
            const eventIds = selectedCalendars[url].map(event => event.id);
            // Eliminar cada evento del calendario
            eventIds.forEach(id => {
                const eventToRemove = calendar.getEventById(id);
                if (eventToRemove) {
                    eventToRemove.remove();
                }
            });
            delete selectedCalendars[url]; // Eliminar del objeto
        }
    }

    // Escuchar cambios en los checkboxes
    document.querySelectorAll('input[name="calendar"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                loadCalendar(this.value);
            } else {
                removeCalendar(this.value);
            }
        });
    });

    // Cargar calendarios marcados por defecto al inicio
    document.querySelectorAll('input[name="calendar"]:checked').forEach(checkbox => {
        loadCalendar(checkbox.value);
    });
});