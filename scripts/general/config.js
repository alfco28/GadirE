// Estado de la aplicación (no se guarda)
//const currentScreen = ; //Para controlar la axcepción del sidebar.
//Controlar filtros del mapa.

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('Error al registrar el ServiceWorker:', error);
      });
  });
}

// Configuración global de la aplicación (se guarda en localStorage)
const appConfig = {
  defaults: {
    fontSize: 'porDefecto',
    highContrastText: false,
    boldText: false,
    enableTransparencies: true,
    animationSpeed: 'porDefecto',
    darkMode: false,
    baseMap: 'claro',
    emphasisColor: 'naranja',
    showZoomButtons: false,
    showGeolocateButton: true,
    showFilters: true,
    homePage: 'mapa',
    localeLang: 'es_es',
    enablePushNotifications: false,
    showNotificationFilters: true,
  },

  state: {},

  load() {
    const saved = localStorage.getItem('gadire_state');
    this.state = saved
      ? { ...this.defaults, ...JSON.parse(saved) }
      : { ...this.defaults };
  },

  save() {
    localStorage.setItem('gadire_state', JSON.stringify(this.state));
  },

  set(key, value) {
    this.state[key] = value;
    this.save();
    this.apply(key, value);
  },

  get(key) {
    return this.state[key];
  },

  apply(key, value) {
    switch (key) {
      case 'fontSize':
        this.applyFontSize(value);
        break;
      case 'highContrastText':
        this.applyHighContrastText(value);
        break;
      case 'boldText':
        this.applyBoldText(value);
        break;
      case 'enableTransparencies':
        this.applyTransparencies(value);
        break;
      case 'animationSpeed':
        this.applyAnimationSpeed(value);
        break;
      case 'darkMode':
        document.documentElement.classList.toggle('dark', value);
        break;
      case 'baseMap':
        this.applyBaseMap(value);
        break;
      case 'emphasisColor':
        this.applyEmphasisColor(value);
        break;
      case 'showZoomButtons':
        this.applyShowZoomButtons(value);
        break;
      case 'showGeolocateButton':
        this.applyShowGeolocateButton(value);
        break;
      case 'showFilters':
        this.applyShowFilters(value);
        break;
      case 'homePage':
        this.applyHomePage(value);
        break;
      case 'enablePushNotifications':
        this.applyPushNotifications(value);
        break;
      case 'showNotificationFilters':
        this.applyShowNotificationFilters(value);
        break;
    }
  },

  applyAll() {
    Object.entries(this.state).forEach(([key, value]) => {
      this.apply(key, value);
    });
  },

  // Funciones para aplicar cada configuración
  applyFontSize(size) {
    document.documentElement.style.setProperty('--tamano-fuente', size === 'grande' ? '18px' : size === 'muyGrande' ? '22px' : '16px');
  },

  applyHighContrastText(enabled) {
    document.documentElement.style.setProperty('--color-texto-primario', enabled ? 'black' : '');
    document.documentElement.style.setProperty('--color-fondo-primario', enabled ? 'white' : '');
  },

  applyBoldText(enabled) {
    document.body.style.fontWeight = enabled ? 'bold' : '';
  },

  applyTransparencies(enabled) {
    const elements = document.querySelectorAll('.elemento-flotante');
    elements.forEach(el => {
      el.style.backdropFilter = enabled ? 'blur(var(--difuminado))' : 'none';
    });
  },

  applyAnimationSpeed(speed) {
    console.log('Cambiar valocidad de animaciones a:', speed);
    const duration = {
      'sinAnimaciones': '0s',
      'rapida': '0.1s',
      'porDefecto': '0.2s',
      'lenta': '0.4s',
      'muyLenta': '0.8s'
    }[speed];
    document.documentElement.style.setProperty('--duracion-transicion', duration);
  },

  applyBaseMap(map) {
    console.log('Cambiar mapa base a:', map);
    // Aquí iría la lógica para cambiar el mapa base
  },

  applyEmphasisColor(color) {
    console.log('Cambiar color de énfasis a:', color);
    const newColor = {
      'amarillo': 'yellow',
      'azul': 'blue',
      'lila': 'purple',
      'naranja': 'orange',
      'rosa': 'pink',
      'turquesa': 'turquoise',
      'verde': 'green'
    }[color];
    document.documentElement.style.setProperty('--color-enfasis', newColor);
  },

  applyShowZoomButtons(show) {
    console.log('Mostrar botones de zoom:', show);
    // Aquí iría la lógica para mostrar/ocultar los botones de zoom
  },

  applyShowGeolocateButton(show) {
    console.log('Mostrar botón de geolocalización:', show);
    const geolocateButton = document.querySelector('.geolocate-button');
    if (geolocateButton) {
      geolocateButton.style.visibility = show ? 'visible' : 'hidden';
      // Si los filtros están visibles, ajusta la posición
      const filtersVisible = appConfig.get('showFilters');
      geolocateButton.style.bottom = filtersVisible ? '126px' : '86px';
    }
  },

  applyShowFilters(show) {
    console.log('Mostrar filtros:', show);
    document.querySelectorAll('.filter-pair').forEach(filter => {
      filter.style.visibility = show ? 'visible' : 'hidden';
    });
    // Actualiza la posición del botón de geolocalización según si los filtros están visibles
    const geolocateButton = document.querySelector('.geolocate-button');
    if (geolocateButton) {
      geolocateButton.style.bottom = show ? '126px' : '86px';
    }
  },

  applyHomePage(page) {
    console.log('Página de inicio:', page);
    // Aquí iría la lógica para cambiar la página de inicio
  },

  applyPushNotifications(enabled) {
    console.log('Notificaciones push:', enabled);
    // Aquí iría la lógica para habilitar/deshabilitar notificaciones push
  },

  applyShowNotificationFilters(show) {
    console.log('Mostrar filtros de notificaciones:', show);
    // Aquí iría la lógica para mostrar/ocultar los filtros de notificaciones
  },
};

// Cargar el estado guardado de la aplicación, si lo hay
appConfig.load();
appConfig.applyAll();

// Conectar todos los elementos de configuración
document.getElementById('tamanoFuente').addEventListener('change', (e) => {
  appConfig.set('fontSize', e.target.value);
});

document.getElementById('high-contrast-text').addEventListener('change', (e) => {
  appConfig.set('highContrastText', e.target.checked);
});

document.getElementById('bold-text').addEventListener('change', (e) => {
  appConfig.set('boldText', e.target.checked);
});

document.getElementById('enable-transparencies').addEventListener('change', (e) => {
  appConfig.set('enableTransparencies', e.target.checked);
});

document.getElementById('velocidadAnimaciones').addEventListener('change', (e) => {
  appConfig.set('animationSpeed', e.target.value);
});

document.getElementById('toggle-darkmode').addEventListener('change', (e) => {
  appConfig.set('darkMode', e.target.checked);
});

document.getElementById('mapaBase').addEventListener('change', (e) => {
  appConfig.set('baseMap', e.target.value);
});

document.getElementById('colorEnfasis').addEventListener('change', (e) => {
  appConfig.set('emphasisColor', e.target.value);
});

document.getElementById('toggle-zoom-buttons').addEventListener('change', (e) => {
  appConfig.set('showZoomButtons', e.target.checked);
});

document.getElementById('toggle-geolocate-button').addEventListener('change', (e) => {
  appConfig.set('showGeolocateButton', e.target.checked);
});

document.getElementById('toggle-filters').addEventListener('change', (e) => {
  appConfig.set('showFilters', e.target.checked);
});

document.getElementById('pagInicio').addEventListener('change', (e) => {
  appConfig.set('homePage', e.target.value);
});

document.getElementById('enable-push-notifications').addEventListener('change', (e) => {
  appConfig.set('enablePushNotifications', e.target.checked);
});

document.getElementById('toggle-notification-filters').addEventListener('change', (e) => {
  appConfig.set('showNotificationFilters', e.target.checked);
});

// Cargar el estado de los elementos de configuración
document.getElementById('tamanoFuente').value = appConfig.get('fontSize');
document.getElementById('high-contrast-text').checked = appConfig.get('highContrastText');
document.getElementById('bold-text').checked = appConfig.get('boldText');
document.getElementById('enable-transparencies').checked = appConfig.get('enableTransparencies');
document.getElementById('velocidadAnimaciones').value = appConfig.get('animationSpeed');
document.getElementById('toggle-darkmode').checked = appConfig.get('darkMode');
document.getElementById('mapaBase').value = appConfig.get('baseMap');
document.getElementById('colorEnfasis').value = appConfig.get('emphasisColor');
document.getElementById('toggle-zoom-buttons').checked = appConfig.get('showZoomButtons');
document.getElementById('toggle-geolocate-button').checked = appConfig.get('showGeolocateButton');
document.getElementById('toggle-filters').checked = appConfig.get('showFilters');
document.getElementById('pagInicio').value = appConfig.get('homePage');
document.getElementById('localeLang').value = appConfig.get('localeLang');
document.getElementById('enable-push-notifications').checked = appConfig.get('enablePushNotifications');
document.getElementById('toggle-notification-filters').checked = appConfig.get('showNotificationFilters');

// Guardar personal data en Local Storage
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 600;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);

        const canvas = document.createElement('canvas');
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const personalDataInputs = {
  name: document.getElementById('personal-data-name'),
  surnames: document.getElementById('personal-data-surnames'),
  centre: document.getElementById('personal-data-centre'),
  campus: document.getElementById('personal-data-campus'),
  photo: document.getElementById('personal-data-photo'),
  barCode: document.getElementById('personal-data-bar-code'),
  includeMyPersonalDataWhenExportingCurrentConfiguration: document.getElementById('personal-data-include-in-export')
};

function populatePersonalDataSelect(select, values, savedValue) {
  select.replaceChildren();

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seleccionar';
  select.appendChild(defaultOption);

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = values.includes(savedValue) ? savedValue : '';
}

const savedPersonalData = JSON.parse(
  localStorage.getItem('personal_data') || '{}'
);

personalDataInputs.name.value = savedPersonalData.name || '';
personalDataInputs.surnames.value = savedPersonalData.surnames || '';
personalDataInputs.barCode.value = savedPersonalData.barCode || '';
personalDataInputs.includeMyPersonalDataWhenExportingCurrentConfiguration.checked = savedPersonalData.includeMyPersonalDataWhenExportingCurrentConfiguration || false;

fetch('/config/univ.json')
  .then(response => response.json())
  .then(universityData => {
    populatePersonalDataSelect(
      personalDataInputs.centre,
      universityData.centres,
      savedPersonalData.centre
    );

    populatePersonalDataSelect(
      personalDataInputs.campus,
      universityData.campus,
      savedPersonalData.campus
    );
  })
  .catch(error => {
    console.error('No se pudieron cargar centros y campus:', error);
  });

function savePersonalData(updatedValues = {}) {
  const savedData = JSON.parse(
    localStorage.getItem('personal_data') || '{}'
  );

  const personalData = {
    ...savedData,
    name: personalDataInputs.name.value,
    surnames: personalDataInputs.surnames.value,
    barCode: personalDataInputs.barCode.value,
    includeMyPersonalDataWhenExportingCurrentConfiguration:
      personalDataInputs
        .includeMyPersonalDataWhenExportingCurrentConfiguration
        .checked,
    ...updatedValues
  };

  if (personalDataInputs.centre.value) {
    personalData.centre = personalDataInputs.centre.value;
  } else {
    delete personalData.centre;
  }

  if (personalDataInputs.campus.value) {
    personalData.campus = personalDataInputs.campus.value;
  } else {
    delete personalData.campus;
  }

  localStorage.setItem('personal_data', JSON.stringify(personalData));

  window.dispatchEvent(new CustomEvent('personalDataUpdated', {
    detail: personalData
  }));
}

personalDataInputs.photo.addEventListener('change', async event => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const photo = await compressImage(file);
  savePersonalData({ photo });
});

personalDataInputs.name.addEventListener('input', savePersonalData);
personalDataInputs.surnames.addEventListener('input', savePersonalData);
personalDataInputs.centre.addEventListener('change', savePersonalData);
personalDataInputs.campus.addEventListener('change', savePersonalData);

function requestLocationPermission() {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta la geolocalización.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      alert(
        'Permiso ya concedido.'
      );
    },
    () => {
      alert(
        'No se ha concedido permiso para acceder a tu ubicación. ' +
        'Puedes cambiarlo desde los permisos del navegador.'
      );
    }
  );
}

const requestLocationAccess = document.getElementById(
  't-settings-privacy-requestAccessToLocation'
);

requestLocationAccess.addEventListener('click', requestLocationPermission);
personalDataInputs.barCode.addEventListener('input', savePersonalData);
personalDataInputs.includeMyPersonalDataWhenExportingCurrentConfiguration
  .addEventListener('change', savePersonalData);