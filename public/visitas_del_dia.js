// Variables globales para el control del calendario y el modal
let calendar;
let currentEventData = null;
let allEvents = [];
let currentSelectedDate = '';

// Función utilitaria para evitar valores nulos o indefinidos en la interfaz
function safeText(value) {
    return (value ?? '').toString();
}

// Abre el modal tipo Wizard y rellena la información detallada de la visita
function openEventModal(eventData) {
    currentEventData = eventData;
    const modal = document.getElementById('eventModal');
    const content = document.getElementById('wizardContent');
    
    // Matriz de datos para mapear las etiquetas con sus propiedades correspondientes
    const rows = [
        ['Código', eventData.codigo_visita],
        ['Fecha', eventData.fecha],
        ['Hora', eventData.hora],
        ['Tipo de visita', eventData.tipo_visita],
        ['Motivo de visita', eventData.motivo_visita || ''],
        ['Estatus', eventData.estatus],
        ['Nombre completo', eventData.nombre_completo || 'No aplica'],
        ['Entidad', eventData.entidad || 'No aplica'],
        ['Cédula/RIF', eventData.cedula_rif],
        ['Teléfono', eventData.telefono],
        ['Sexo', eventData.sexo || ''],
        ['Edad', eventData.edad || ''],
        ['Municipio', eventData.municipio || ''],
        ['Sector', eventData.sector || ''],
        ['Cargo', eventData.cargo || ''],
        ['Función', eventData.funcion || ''],
        ['Actividad económica', eventData.actividad_economica || ''],
        ['Funcionario', eventData.funcionario || ''],
        ['Tipo de contacto', eventData.tipo_contacto],
        ['Código OT', eventData.codigo_ot || 'No aplica'],
        ['Detalle OT', eventData.detalle_ot || 'No aplica']
    ];

    // Inyección dinámica de las filas en el grid del modal
    content.innerHTML = rows.map(([label, value]) => `
        <div class="wizard-row">
            <div class="wizard-label">${safeText(label)}</div>
            <div class="wizard-value">${safeText(value)}</div>
        </div>
    `).join('');

    // Muestra el modal agregando la clase CSS
    modal.classList.add('open');
    
    // Activa el botón de descarga del PDF
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) downloadBtn.disabled = false;
}

// Cierra el modal y restablece el estado del botón de PDF
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('open');
    currentEventData = null;
    
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) downloadBtn.disabled = true;
}

// Genera el reporte PDF utilizando la librería html2pdf.js
function generatePDF() {
    if (!currentEventData) return alert('No hay datos para generar el PDF.');
    const content = document.getElementById('wizardContent');
    
    // Clonamos el nodo para aplicarle estilos de impresión sin alterar la vista web
    const clone = content.cloneNode(true);
    clone.style.padding = '20px';
    clone.style.background = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.width = '800px';

    const wrapper = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = 'Reporte de visita - ' + (currentEventData.codigo_visita || 'Visita');
    title.style.fontFamily = 'Arial, Helvetica, sans-serif';
    title.style.margin = '0 0 12px 0';
    wrapper.appendChild(title);
    wrapper.appendChild(clone);

    const opt = {
        margin:       10,
        filename:     `${currentEventData.codigo_visita || 'visita'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(wrapper).save();
}

// Obtiene la fecha actual en formato ISO (YYYY-MM-DD) respetando la zona horaria local
// Corregido: para usar la fecha en hora de Venezuela (UTC-4) o local del navegador del cliente
function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Transforma una fecha ISO en un formato legible para Venezuela
function formatDateLabel(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Renderiza las visitas como tarjetas dentro del contenedor de detalles
function renderCards(visits) {
    const container = document.getElementById('visitasCardsContainer');
    container.innerHTML = '';

    visits.forEach((visit) => {
        const card = document.createElement('div');
        card.className = 'visit-card';
        
        let statusClass = 'status-default';
        if (visit.estatus === 'Procesada') statusClass = 'status-procesada';
        else if (visit.estatus === 'Rechasada') statusClass = 'status-rechasada';
        else if (visit.estatus === 'En Revision') statusClass = 'status-revision';
        else if (visit.estatus === 'Otras') statusClass = 'status-otras';

        const visitorName = visit.nombre_completo || 'Visitante';
        const entityName = visit.entidad || visit.nombre_entidad || '';
        const displayName = entityName && entityName !== visitorName 
            ? `${visitorName} (${entityName})` 
            : visitorName;

        card.innerHTML = `
            <div class="visit-card-header">
                <div class="visit-card-time-badge">
                    <svg class="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${safeText(visit.hora).slice(0, 5)}</span>
                </div>
                <span class="visit-card-status-badge ${statusClass}">${safeText(visit.estatus)}</span>
            </div>
            <div class="visit-card-body">
                <h4 class="visit-card-title">${safeText(displayName)}</h4>
                <div class="visit-card-meta">
                    <p><strong>Cédula/RIF:</strong> ${safeText(visit.cedula_rif)}</p>
                    <p><strong>Teléfono:</strong> ${safeText(visit.telefono)}</p>
                    <p><strong>Motivo:</strong> ${safeText(visit.motivo_visita || visit.tipo_visita)}</p>
                </div>
            </div>
            <div class="visit-card-footer">
                <button class="btn-card-action" type="button">Ver Detalles</button>
            </div>
        `;
        
        // Agregar manejador para abrir el modal con el detalle completo
        card.querySelector('.btn-card-action').addEventListener('click', () => {
            openEventModal({
                codigo_visita: visit.codigo_visita,
                fecha: visit.fecha,
                hora: visit.hora,
                tipo_visita: visit.tipo_visita,
                motivo_visita: visit.motivo_visita,
                estatus: visit.estatus,
                nombre_completo: visit.nombre_completo,
                entidad: visit.entidad,
                nombre_entidad: visit.nombre_entidad,
                cedula_rif: visit.cedula_rif,
                telefono: visit.telefono,
                sexo: visit.sexo || visit.Sexo,
                edad: visit.edad || visit.Edad,
                municipio: visit.municipio,
                sector: visit.sector,
                cargo: visit.cargo,
                funcion: visit.funcion,
                actividad_economica: visit.actividad_economica,
                funcionario: visit.funcionario,
                tipo_contacto: visit.tipo_contacto || 'Individual',
                cordinacion_referida: visit.cordinacion_referida || visit.Cordinacion_Referida,
                observaciones: visit.observaciones,
                codigo_ot: visit.codigo_ot,
                detalle_ot: visit.detalle_ot
            });
        });
        
        container.appendChild(card);
    });
}

// Filtra la lista global de eventos para el calendario según la cédula/RIF
function getFilteredEvents() {
    const searchInput = document.getElementById('searchCedulaRif');
    const filterVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!filterVal) return allEvents;
    return allEvents.filter(e => {
        const props = e.extendedProps || {};
        return safeText(props.cedula_rif).toLowerCase().includes(filterVal);
    });
}

// Consulta las visitas de una fecha específica a la API del backend
async function loadVisitasByDate(isoDate) {
    currentSelectedDate = isoDate;
    const status = document.getElementById('status');
    const errorBox = document.getElementById('errorBox');
    const emptyBox = document.getElementById('emptyBox');
    const tableWrapper = document.getElementById('tableWrapper');
    const selectedDate = document.getElementById('selectedDate');

    status.textContent = 'Consultando visitas por fecha...';
    errorBox.style.display = 'none';
    emptyBox.style.display = 'none';
    tableWrapper.style.display = 'none';
    selectedDate.textContent = `Fecha seleccionada: ${formatDateLabel(isoDate)}`;

    try {
        const response = await fetch(`/api/visitas-por-fecha?fecha=${encodeURIComponent(isoDate)}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('No se pudo consultar la información del servidor.');
        }

        const data = await response.json();
        const visits = Array.isArray(data.visits) ? data.visits : [];

        // Filtrar localmente por cédula/RIF si hay un valor ingresado
        const searchInput = document.getElementById('searchCedulaRif');
        const filterVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let filteredVisits = visits;
        if (filterVal) {
            filteredVisits = visits.filter(v => safeText(v.cedula_rif).toLowerCase().includes(filterVal));
        }

        if (filteredVisits.length === 0) {
            status.textContent = filterVal 
                ? 'Sin resultados coincidentes para la Cédula/RIF en la fecha seleccionada.'
                : 'Sin resultados para la fecha seleccionada.';
            emptyBox.style.display = 'block';
            return;
        }

        renderCards(filteredVisits);
        status.textContent = `Total de visitas para la fecha seleccionada: ${filteredVisits.length}`;
        tableWrapper.style.display = 'block';
    } catch (error) {
        status.textContent = 'Error al cargar visitas por fecha.';
        errorBox.textContent = error.message || 'Error no esperado.';
        errorBox.style.display = 'block';
    }
}

// Consume los eventos generales que se pintarán como puntos/barras en el calendario
async function loadCalendarEvents() {
    const response = await fetch('/api/visitas-eventos', {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error('No se pudieron cargar los eventos del calendario.');
    }

    const data = await response.json();
    return Array.isArray(data.events) ? data.events : [];
}

// Inicializa la instancia de FullCalendar con configuraciones en español
async function initCalendar() {
    const status = document.getElementById('status');
    const errorBox = document.getElementById('errorBox');
    const todayISO = getTodayISO();
    currentSelectedDate = todayISO;

    try {
        const events = await loadCalendarEvents();
        allEvents = events;
        
        calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
            locale: 'es',
            initialView: 'dayGridMonth',
            height: 'auto',
            firstDay: 1,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
            },
            events: getFilteredEvents(),
            dateClick: function(info) {
                loadVisitasByDate(info.dateStr);
            },
            eventClick: function(info) {
                const props = info.event.extendedProps || {};
                openEventModal({
                    codigo_visita: props.codigo_visita || info.event.id,
                    fecha: props.fecha || info.event.startStr.slice(0, 10),
                    hora: props.hora || '',
                    tipo_visita: props.tipo_visita || '',
                    motivo_visita: props.motivo_visita || '',
                    estatus: props.estatus || '',
                    nombre_completo: props.nombre_completo || '',
                    entidad: props.entidad || '',
                    nombre_entidad: props.nombre_entidad || '',
                    cedula_rif: props.cedula_rif || '',
                    telefono: props.telefono || '',
                    sexo: props.sexo || '',
                    edad: props.edad || '',
                    municipio: props.municipio || '',
                    sector: props.sector || '',
                    cargo: props.cargo || '',
                    funcion: props.funcion || '',
                    actividad_economica: props.actividad_economica || '',
                    funcionario: props.funcionario || '',
                    tipo_contacto: props.tipo_contacto || '',
                    cordinacion_referida: props.cordinacion_referida || '',
                    observaciones: props.observaciones || '',
                    codigo_ot: props.codigo_ot || '',
                    detalle_ot: props.detalle_ot || ''
                });
            }
        });

        calendar.render();
        await loadVisitasByDate(todayISO);
        const totalCount = allEvents.length;
        const filteredCount = getFilteredEvents().length;
        status.textContent = `Calendario cargado. Eventos mostrados: ${filteredCount} de ${totalCount}`;
        errorBox.style.display = 'none';
    } catch (error) {
        status.textContent = 'Error al cargar el calendario.';
        errorBox.textContent = error.message || 'Error no esperado.';
        errorBox.style.display = 'block';
    }
}

// Destruye y recrea el calendario para forzar una recarga limpia de datos
async function refreshCalendar() {
    if (calendar) {
        calendar.destroy();
    }
    await initCalendar();
}

// --- PROTECCIÓN DE CARGA (Asegura que el DOM exista antes de mapear eventos) ---
document.addEventListener('DOMContentLoaded', function() {
    // Listeners para los botones e interacciones de la interfaz
    document.getElementById('reloadBtn').addEventListener('click', refreshCalendar);
    document.getElementById('wizardCloseBtn').addEventListener('click', closeEventModal);
    document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
    
    // Cierre de modal al hacer click fuera del contenedor blanco
    document.getElementById('eventModal').addEventListener('click', function(event) {
        if (event.target.id === 'eventModal') {
            closeEventModal();
        }
    });

    // Cierre de modal al presionar la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeEventModal();
        }
    });

    // Filtro por Cédula / RIF en tiempo real
    const searchInput = document.getElementById('searchCedulaRif');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    function applyFilter() {
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getFilteredEvents());
            
            const totalCount = allEvents.length;
            const filteredCount = getFilteredEvents().length;
            document.getElementById('status').textContent = `Filtro aplicado. Eventos mostrados: ${filteredCount} de ${totalCount}`;
        }
        loadVisitasByDate(currentSelectedDate);
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            applyFilter();
        });
    }

    // Arranca el flujo de la aplicación
    initCalendar();
});
