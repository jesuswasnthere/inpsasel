JavaScript
// Variables globales para el control del calendario y el modal
let calendar;
let currentEventData = null;

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

// Renderiza las filas correspondientes dentro de la tabla de detalles
function renderRows(visits) {
    const tbody = document.getElementById('visitasBody');
    tbody.innerHTML = '';

    visits.forEach((visit) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${safeText(visit.codigo_visita)}</td>
            <td>${safeText(visit.hora).slice(0, 5)}</td>
            <td>${safeText(visit.tipo_visita)}</td>
            <td>${safeText(visit.estatus)}</td>
            <td>${safeText(visit.nombre_completo)}</td>
            <td>${safeText(visit.nombre_entidad)}</td>
            <td>${safeText(visit.cedula_rif)}</td>
            <td>${safeText(visit.telefono)}</td>
            <td>${safeText(visit.codigo_ot)}</td>
            <td>${safeText(visit.detalle_ot)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Consulta las visitas de una fecha específica a la API del backend
async function loadVisitasByDate(isoDate) {
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

        if (visits.length === 0) {
            status.textContent = 'Sin resultados para la fecha seleccionada.';
            emptyBox.style.display = 'block';
            return;
        }

        renderRows(visits);
        status.textContent = `Total de visitas para la fecha seleccionada: ${visits.length}`;
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

    try {
        const events = await loadCalendarEvents();
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
            events,
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
        status.textContent = `Calendario cargado. Eventos totales: ${events.length}`;
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

    // Arranca el flujo de la aplicación
    initCalendar();
});