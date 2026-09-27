// Archivo de ejemplo
// Controla las interacciones de los ejemplos de menú y agenda.
document.addEventListener('DOMContentLoaded', () => {
	const menuButton = document.getElementById('mostrar-menu');
	const menuList = document.getElementById('menu-list');

	if (menuButton && menuList) {
		menuButton.addEventListener('click', () => {
			const willOpen = menuList.hidden;
			menuList.hidden = !willOpen;
			menuButton.setAttribute('aria-expanded', String(willOpen));
			menuButton.textContent = willOpen ? 'Ocultar menú' : 'Mostrar menú';
		});
	}

	// Datos locales para demostrar que el JavaScript del iframe funciona.
	const activities = {
		lunes: [
			{ time: '10:00', title: 'Bienvenida al campus', place: 'Aula 1.2' },
			{ time: '12:30', title: 'Taller de asociaciones', place: 'Sala multiusos' },
			{ time: '16:00', title: 'Club de lectura', place: 'Biblioteca' }
		],
		martes: [
			{ time: '09:30', title: 'Orientación académica', place: 'Punto de información' },
			{ time: '13:00', title: 'Encuentro de estudiantes', place: 'Patio central' }
		],
		miercoles: [
			{ time: '11:00', title: 'Taller de programación', place: 'Laboratorio 2' },
			{ time: '18:00', title: 'Cinefórum', place: 'Salón de actos' }
		]
	};

	const eventsList = document.getElementById('agenda-events');
	const dayTitle = document.getElementById('agenda-day-title');
	const dayButtons = document.querySelectorAll('[data-agenda-day]');

	function renderAgenda(day) {
		const dayName = day === 'miercoles' ? 'miércoles' : day;
		dayTitle.textContent = `Actividades del ${dayName}`;
		eventsList.replaceChildren();

		activities[day].forEach(activity => {
			const item = document.createElement('li');
			item.className = 'event-item';

			const time = document.createElement('span');
			time.className = 'event-time';
			time.textContent = activity.time;

			const title = document.createElement('strong');
			title.textContent = activity.title;

			const place = document.createElement('span');
			place.textContent = ` · ${activity.place}`;

			item.append(time, title, place);
			eventsList.appendChild(item);
		});
	}

	dayButtons.forEach(button => {
		button.addEventListener('click', () => {
			dayButtons.forEach(dayButton => {
				dayButton.setAttribute('aria-pressed', String(dayButton === button));
			});

			renderAgenda(button.dataset.agendaDay);
		});
	});

	if (eventsList && dayTitle) {
		renderAgenda('lunes');
	}

	// Refresca los indicadores cuando el cargador sincroniza el tema del proyecto.
	function updateThemeStatus() {
		const rootStyle = getComputedStyle(document.documentElement);
		const modeLabel = document.getElementById('theme-mode');
		const fontLabel = document.getElementById('theme-font');
		const accentLabel = document.getElementById('theme-accent');
		const accentColor = rootStyle.getPropertyValue('--color-enfasis').trim();

		if (modeLabel) {
			modeLabel.textContent = document.documentElement.classList.contains('dark')
				? 'Oscuro'
				: 'Claro';
		}

		if (fontLabel) {
			fontLabel.textContent = getComputedStyle(document.body).fontFamily;
		}

		if (accentLabel) {
			accentLabel.textContent = accentColor || 'No recibido';
		}
	}

	updateThemeStatus();

	const themeObserver = new MutationObserver(updateThemeStatus);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class', 'style']
	});
});