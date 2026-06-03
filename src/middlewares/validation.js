const ALLOWED_SEXO = ['Masculino', 'Femenino', 'Otro'];
const ALLOWED_SECTOR = ['Publico', 'Privado'];
const ALLOWED_FUNCION = ['DDP', 'CSSL', 'SERV', 'TRAB', 'OTRO'];
const ALLOWED_ESTATUS = ['Procesada', 'Rechasada', 'En Revision', 'Otras'];
const ALLOWED_municipio = ['Agua Blanca', 'Araure', 'Esteller', 'Guanare', 'Guanarito', 'Monseñor José Vicente de Unda', 'Ospino', 'Páez', 'Papelón', 'San Genaro de Boconoíto', 'San Rafael de Onoto', 'Santa Rosalía', 'Sucre', 'Turén'];
const ALLOWED_CORDINACION_REFERIDA = ['Inspecciones', 'Educacion', 'Sanciones', 'Salud laboral', 'Psicosocial', 'Epidemiologia'];
const ALLOWED_TIPOS = ['Técnica', 'Comercial', 'Soporte', 'Inspección', 'Personal', 'Administrativa', 'Consulta'];
const ALLOWED_TIPO_CONTACTO = ['Individual', 'Empresa', 'Organización'];

function validateVisitBody(body) {
  const errors = [];
  const {
    fecha,
    hora,
    estatus,
    cedula_rif,
    nombre_completo,
    telefono,
    Sexo,
    Edad,
    motivo_visita,
    municipio,
    sector,
    entidad,
    cargo,
    funcion,
    actividad_economica,
    Cordinacion_Referida,
    funcionario,
    codigo_ot,
  } = body;

  if (!fecha) errors.push('Fecha es obligatoria.');
  if (!hora) errors.push('Hora es obligatoria.');
  if (!estatus) errors.push('Estatus es obligatorio.');
  if (estatus && !ALLOWED_ESTATUS.includes(estatus)) errors.push(`Estatus inválido. Valores válidos: ${ALLOWED_ESTATUS.join(', ')}.`);
  
  if (!nombre_completo) errors.push('Nombre completo es obligatorio.');
  if (nombre_completo && String(nombre_completo).length > 255) errors.push('Nombre completo no puede exceder los 255 caracteres.');
  
  if (!Sexo) errors.push('Sexo es obligatorio.');
  if (Sexo && !ALLOWED_SEXO.includes(Sexo)) errors.push(`Sexo inválido. Valores válidos: ${ALLOWED_SEXO.join(', ')}.`);
  
  if (!Edad) errors.push('Edad es obligatoria.');
  if (Edad && (!Number.isInteger(Number(Edad)) || Number(Edad) <= 0)) errors.push('Edad debe ser un número entero positivo.');
  
  if (!motivo_visita) errors.push('Motivo de visita es obligatorio.');
  
  if (!cedula_rif) errors.push('Cédula o RIF es obligatorio.');
  if (cedula_rif && String(cedula_rif).length > 20) errors.push('Cédula o RIF no puede exceder los 20 caracteres.');
  
  if (!telefono) errors.push('Teléfono es obligatorio.');
  if (telefono && String(telefono).length < 7) errors.push('Teléfono parece demasiado corto.');
  if (telefono && String(telefono).length > 20) errors.push('Teléfono no puede exceder los 20 caracteres.');
  
  if (!municipio) errors.push('Municipio es obligatorio.');
  if (municipio && !ALLOWED_municipio.includes(municipio)) errors.push(`Municipio inválido. Valores válidos: ${ALLOWED_municipio.join(', ')}.`);
  
  if (!sector) errors.push('Sector es obligatorio.');
  if (sector && !ALLOWED_SECTOR.includes(sector)) errors.push(`Sector inválido. Valores válidos: ${ALLOWED_SECTOR.join(', ')}.`);
  
  if (!entidad) errors.push('Entidad es obligatoria.');
  if (entidad && String(entidad).length > 255) errors.push('Entidad no puede exceder los 255 caracteres.');
  
  if (!cargo) errors.push('Cargo es obligatorio.');
  if (cargo && String(cargo).length > 255) errors.push('Cargo no puede exceder los 255 caracteres.');
  
  if (!funcion) errors.push('Función es obligatoria.');
  if (funcion && !ALLOWED_FUNCION.includes(funcion)) errors.push(`Función inválida. Valores válidos: ${ALLOWED_FUNCION.join(', ')}.`);
  
  if (!actividad_economica) errors.push('Actividad económica es obligatoria.');
  if (actividad_economica && String(actividad_economica).length > 255) errors.push('Actividad económica no puede exceder los 255 caracteres.');
  
  if (!Cordinacion_Referida) errors.push('Coordinación referida es obligatoria.');
  if (Cordinacion_Referida && !ALLOWED_CORDINACION_REFERIDA.includes(Cordinacion_Referida)) errors.push(`Coordinación referida inválida. Valores válidos: ${ALLOWED_CORDINACION_REFERIDA.join(', ')}.`);
  
  if (!funcionario) errors.push('Funcionario es obligatorio.');
  if (funcionario && String(funcionario).length > 255) errors.push('Funcionario no puede exceder los 255 caracteres.');

  if (codigo_ot && String(codigo_ot).length > 20) errors.push('Código OT no puede exceder los 20 caracteres.');

  if (fecha && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fecha)) errors.push('Formato de fecha inválido. Use AAAA-MM-DD.');
  const horaVal = typeof hora === 'string' ? hora.trim() : (hora || '');
  if (hora && !/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(horaVal)) errors.push('Formato de hora inválido. Use HH:MM.');

  return errors;
}

module.exports = {
  ALLOWED_SEXO,
  ALLOWED_SECTOR,
  ALLOWED_FUNCION,
  ALLOWED_ESTATUS,
  ALLOWED_municipio,
  ALLOWED_CORDINACION_REFERIDA,
  ALLOWED_TIPOS,
  ALLOWED_TIPO_CONTACTO,
  validateVisitBody,
};
