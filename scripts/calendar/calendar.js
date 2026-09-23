// Variables y funciones globales
var calendar;
var selectedCalendars = {}; // Objeto para almacenar eventos por URL de calendario

fetch('/config/univ.json')
    .then(response => response.json())
    .then(data => {
        generateCalendarSelector(data.calendars);
        // Cargar selección guardada en localStorage
        loadSavedSelections();
        // Cargar calendarios marcados (por defecto o localStorage)
        loadCheckedCalendars();
    })
    .catch(error => console.error('Error al cargar el JSON:', error));

import ICAL from "/libraries/icaljs/ical.min.js";

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
            calendar.refetchEvents(); // Forzar redibujado
        })
        .catch(error => console.error("Error al cargar el calendario:", error));
}

// Función para eliminar eventos de un calendario
function removeCalendar(url) {
    if (selectedCalendars[url]) {
        // Eliminar todos los eventos del calendario
        calendar.removeAllEventSources();
        // Volver a añadir solo los eventos de los calendarios seleccionados
        document.querySelectorAll('input[name="calendar"]:checked').forEach(checkbox => {
            if (checkbox.value !== url) {
                loadCalendar(checkbox.value);
            }
        });
        delete selectedCalendars[url];
    }
}

// Función para cargar calendarios marcados (por defecto o localStorage)
function loadCheckedCalendars() {
    document.querySelectorAll('input[name="calendar"]:checked').forEach(checkbox => {
        loadCalendar(checkbox.value);
    });
}

// Guardar selección de calendarios en localStorage
function saveSelection(id, isChecked) {
    const selections = JSON.parse(localStorage.getItem('calendarSelections') || '{}');
    selections[id] = isChecked;
    localStorage.setItem('calendarSelections', JSON.stringify(selections));
}

// Cargar selección de calendarios guardada en localStorage
function loadSavedSelections() {
    const selections = JSON.parse(localStorage.getItem('calendarSelections') || '{}');
    document.querySelectorAll('input[name="calendar"]').forEach(checkbox => {
        if (selections[checkbox.id] !== undefined) {
            checkbox.checked = selections[checkbox.id];
        }
    });
}

function generateCalendarSelector(calendarsData) {
    const selector = document.getElementById('calendar-options');
    selector.innerHTML = ''; // Limpiar contenido previo

    for (const [theme, calendars] of Object.entries(calendarsData.byTheme)) {
        // Crear sección por tema
        const themeDiv = document.createElement('div');
        themeDiv.className = 'theme-section';

        const themeTitle = document.createElement('h3');
        themeTitle.textContent = theme;
        themeDiv.appendChild(themeTitle);

        // Crear checkboxes para cada calendario
        calendars.forEach(calendar => {
            const label = document.createElement('label');
            label.className = 'calendar-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'calendar';
        checkbox.value = calendar.path;
        checkbox.id = calendar.id;
        checkbox.checked = calendar.checked;

        const span = document.createElement('span');
        span.textContent = calendar.name;

        label.appendChild(checkbox);
        label.appendChild(span);
        themeDiv.appendChild(label);
    });

    selector.appendChild(themeDiv);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    // Inicializar FullCalendar
    calendar = new FullCalendar.Calendar(calendarEl, {
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

    // Escuchar cambios en los checkboxes (event delegation)
    document.getElementById('calendar-options').addEventListener('change', function(e) {
        if (e.target.name === 'calendar') {
            const checkbox = e.target;
            saveSelection(checkbox.id, checkbox.checked);
            if (checkbox.checked) {
                loadCalendar(checkbox.value);
            } else {
                removeCalendar(checkbox.value);
            }
        }
    });

    // Cargar calendarios marcados por defecto al inicio
    document.querySelectorAll('input[name="calendar"]:checked').forEach(checkbox => {
        loadCalendar(checkbox.value);
    });
});