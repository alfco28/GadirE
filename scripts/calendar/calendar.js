import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedCalendars = {}; // Objeto para almacenar eventos por URL de calendario

    // Inicializar FullCalendar
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        editable: false,
        firstDay: 1,
        events: [], // Eventos iniciales (vacío)
        eventClick: function(info) {
            const event = info.event;
            const title = event.title;
            const isAllDay = event.allDay;
            const start = event.start;
            const end = event.end;
            const location = event.extendedProps.location || 'No especificada';
            const description = event.extendedProps.description || 'No hay descripción';

            // Formatear fecha/hora según si es "todo el día"
            let dateInfo = '';
            if (isAllDay) {
                dateInfo = `<p><strong>Día:</strong> ${start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
            } else {
                dateInfo = `
                    <p><strong>Inicio:</strong> ${start.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Fin:</strong> ${end ? end.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No especificado'}</p>
                `;
            }
        
            // Contenido de la ventana modal
            const content = `
                ${dateInfo}
                <p><strong>Ubicación:</strong> ${location}</p>
                <p><strong>Descripción:</strong> ${description}</p>
            `;
        
            // Abrir la ventana modal
            openMW(title, content);
            info.jsEvent.preventDefault();
        }
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
                id: e.uid || Math.random().toString(36).substring(2, 15), // Añadir un identificador único para el evento (por ejemplo, UID del ICS)
                extendedProps: {
                    description: e.description || '',
                    location: e.location || ''
                }
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