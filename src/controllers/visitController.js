const { pool } = require('../config/db');
const { validateVisitBody } = require('../middlewares/validation');
const { getAuthenticatedUser, DEFAULT_USER_ID } = require('../middlewares/auth');

let supportsSplitContactFields = false;
let detectColumnsPromise = null;

async function detectContactColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contactos'
        AND column_name IN ('nombre_completo', 'entidad')
    `);

    const names = new Set(result.rows.map((row) => row.column_name));
    supportsSplitContactFields = names.has('nombre_completo') && names.has('entidad');
  } catch (err) {
    console.warn('Advertencia: no se pudo detectar columnas de contactos. Se asumirá modo legacy.');
    console.warn('Detalles:', err && err.message ? err.message : err);
    supportsSplitContactFields = false;
  }
}

function contactSelectSql(alias = 'c') {
  if (supportsSplitContactFields) {
    return `${alias}.nombre_completo, ${alias}.entidad, COALESCE(NULLIF(${alias}.entidad, ''), NULLIF(${alias}.nombre_completo, ''), ${alias}.nombre_entidad) AS nombre_entidad`;
  }
  return `NULL::varchar AS nombre_completo, NULL::varchar AS entidad, ${alias}.nombre_entidad AS nombre_entidad`;
}

function contactSearchSql(alias = 'c') {
  if (supportsSplitContactFields) {
    return `COALESCE(${alias}.nombre_completo, '') ILIKE $1 OR COALESCE(${alias}.entidad, '') ILIKE $1 OR COALESCE(${alias}.nombre_entidad, '') ILIKE $1`;
  }
  return `COALESCE(${alias}.nombre_entidad, '') ILIKE $1`;
}

async function ensureContactColumns() {
  if (!detectColumnsPromise) {
    detectColumnsPromise = detectContactColumns().catch((err) => {
      console.error('Error inicializando columnas de contacto (continua en modo legacy):', err && err.message ? err.message : err);
      supportsSplitContactFields = false;
    });
  }
  return detectColumnsPromise;
}

function normalizeContactData(body) {
  const tipoContacto = String(body.tipo_contacto || '').trim();
  const legacyNombreEntidad = String(body.nombre_entidad || '').trim();
  let nombreCompleto = String(body.nombre_completo || '').trim();
  let entidad = String(body.entidad || '').trim();

  if (!nombreCompleto && tipoContacto === 'Individual') {
    nombreCompleto = legacyNombreEntidad;
  }

  if (!entidad && tipoContacto && tipoContacto !== 'Individual') {
    entidad = legacyNombreEntidad;
  }

  const nombreEntidad = entidad || nombreCompleto || legacyNombreEntidad;
  return {
    nombre_completo: nombreCompleto,
    entidad,
    nombre_entidad: nombreEntidad,
  };
}

async function requireContactColumns(req, res, next) {
  try {
    await ensureContactColumns();
    next();
  } catch (err) {
    next(err);
  }
}

function isPostgresAuthError(err) {
  return err && err.code === '28P01';
}

async function registerVisit(req, res) {
  const {
    fecha,
    hora,
    estatus,
    cedula_rif,
    nombre_completo,
    entidad,
    nombre_entidad,
    telefono,
    Sexo,
    Edad,
    motivo_visita,
    municipio,
    sector,
    cargo,
    funcion,
    actividad_economica,
    Cordinacion_Referida,
    funcionario,
    codigo_ot,
    detalle_ot,
    cordinacion_referida,
    observaciones
  } = req.body;
  const contactData = normalizeContactData({ nombre_completo, entidad, nombre_entidad, tipo_contacto: 'Individual' });

  const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
  const errors = validateVisitBody(req.body);

  if (errors.length > 0) {
    const message = `Errores de validación: ${errors.join(' ')}`;
    return wantsJson
      ? res.status(400).json({ success: false, message, errors })
      : res.status(400).send(message);
  }

  try {
    let contactoResult = await pool.query(
      'SELECT id_contacto FROM CONTACTOS WHERE cedula_rif = $1',
      [cedula_rif]
    );

    let id_contacto;
    if (contactoResult.rows.length > 0) {
      id_contacto = contactoResult.rows[0].id_contacto;
      if (supportsSplitContactFields) {
        await pool.query(
          'UPDATE CONTACTOS SET nombre_completo = $1, entidad = $2, nombre_entidad = $3, telefono = $4, tipo_contacto = $5 WHERE id_contacto = $6',
          [contactData.nombre_completo || null, contactData.entidad || null, contactData.nombre_entidad, telefono, 'Individual', id_contacto]
        );
      } else {
        await pool.query(
          'UPDATE CONTACTOS SET nombre_entidad = $1, telefono = $2, tipo_contacto = $3 WHERE id_contacto = $4',
          [contactData.nombre_entidad, telefono, 'Individual', id_contacto]
        );
      }
    } else {
      const insertContacto = supportsSplitContactFields
        ? await pool.query(
          'INSERT INTO CONTACTOS (cedula_rif, nombre_completo, entidad, nombre_entidad, telefono, tipo_contacto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_contacto',
          [cedula_rif, contactData.nombre_completo || null, contactData.entidad || null, contactData.nombre_entidad, telefono, 'Individual']
        )
        : await pool.query(
          'INSERT INTO CONTACTOS (cedula_rif, nombre_entidad, telefono, tipo_contacto) VALUES ($1, $2, $3, $4) RETURNING id_contacto',
          [cedula_rif, contactData.nombre_entidad, telefono, 'Individual']
        );
      id_contacto = insertContacto.rows[0].id_contacto;
    }

    let id_orden = null;
    if (codigo_ot) {
      const ordenResult = await pool.query(
        'INSERT INTO ORDENES_TRABAJO (codigo_ot, detalle) VALUES ($1, $2) ON CONFLICT (codigo_ot) DO UPDATE SET detalle = EXCLUDED.detalle RETURNING id_orden',
        [codigo_ot, detalle_ot || '']
      );
      id_orden = ordenResult.rows[0].id_orden;
    }

    const codigo_visita = `VIS-${Date.now()}`;
    const authUser = getAuthenticatedUser(req);
    const id_usuario = authUser ? authUser.userId : (req.session.userId || DEFAULT_USER_ID);

    const userCheck = await pool.query('SELECT id_usuario FROM USUARIOS WHERE id_usuario = $1', [id_usuario]);
    if (userCheck.rows.length === 0) {
      const message = `Error: el usuario predeterminado con id ${id_usuario} no existe. Configura DEFAULT_USER_ID en .env o inicia sesión.`;
      return wantsJson
        ? res.status(400).json({ success: false, message })
        : res.status(400).send(message);
    }

    await pool.query(
      `INSERT INTO VISITAS (codigo_visita, fecha, hora, tipo_visita, motivo_visita, estatus, cordinacion_referida, observaciones, sexo, edad, municipio, sector, cargo, funcion, actividad_economica, funcionario, id_contacto, id_usuario, id_orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [codigo_visita, fecha, hora, 'Personal', motivo_visita || null, estatus, Cordinacion_Referida || cordinacion_referida || null, observaciones || null, Sexo || null, Edad ? Number(Edad) : null, municipio || null, sector || null, cargo || null, funcion || null, actividad_economica || null, funcionario || null, id_contacto, id_usuario, id_orden]
    );

    const message = `Visita registrada exitosamente. Código: ${codigo_visita}`;
    if (wantsJson) {
      return res.json({ success: true, message, codigo_visita });
    }

    return res.redirect(303, `/success?code=${encodeURIComponent(codigo_visita)}`);
  } catch (err) {
    console.error(err);
    const message = `Error al registrar la visita: ${err.message}`;
    return wantsJson
      ? res.status(500).json({ success: false, message })
      : res.status(500).send(message);
  }
}

async function getVisitas(req, res) {
  const { codigo_visita } = req.query;
  if (!codigo_visita) {
    return res.status(400).json({ success: false, message: 'Código de visita requerido' });
  }

  try {
    const searchTerm = `%${codigo_visita.trim()}%`;
    const result = await pool.query(`
      SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.motivo_visita, v.estatus, v.cordinacion_referida, v.observaciones,
             v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario,
             ${contactSelectSql('c')},
             c.cedula_rif, c.telefono, c.tipo_contacto,
             o.codigo_ot, o.detalle AS detalle_ot
      FROM VISITAS v
      LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
      LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
      WHERE v.codigo_visita ILIKE $1
         OR c.cedula_rif ILIKE $1
         OR ${contactSearchSql('c')}
      ORDER BY v.fecha DESC, v.hora DESC
      LIMIT 20
    `, [searchTerm]);

    res.json({ success: true, visits: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al buscar visitas' });
  }
}

async function getRecentVisitas(req, res) {
  try {
    const result = await pool.query(`
       SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.motivo_visita, v.estatus, v.cordinacion_referida, v.observaciones,
              v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario,
              ${contactSelectSql('c')},
              c.cedula_rif, c.telefono, c.tipo_contacto,
              o.codigo_ot, o.detalle AS detalle_ot
       FROM VISITAS v
       LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
       LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
       ORDER BY v.fecha DESC, v.hora DESC
       LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener visitas');
  }
}

async function getVisitasDelDia(req, res) {
  try {
    const result = await pool.query(`
      SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.motivo_visita, v.estatus, v.cordinacion_referida, v.observaciones,
             v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario,
             ${contactSelectSql('c')},
             c.cedula_rif, c.telefono, c.tipo_contacto,
             o.codigo_ot, o.detalle AS detalle_ot
      FROM VISITAS v
      LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
      LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
      WHERE v.fecha = CURRENT_DATE
      ORDER BY v.hora DESC
    `);

    res.json({ success: true, visits: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener visitas del día' });
  }
}

async function getVisitasPorFecha(req, res) {
  const { fecha } = req.query;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({
      success: false,
      message: 'Parámetro fecha inválido. Use formato AAAA-MM-DD.'
    });
  }

  try {
    const result = await pool.query(`
      SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.motivo_visita, v.estatus,
             v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario,
             ${contactSelectSql('c')},
             c.cedula_rif, c.telefono, c.tipo_contacto,
             o.codigo_ot, o.detalle AS detalle_ot
      FROM VISITAS v
      LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
      LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
      WHERE v.fecha = $1::date
      ORDER BY v.hora ASC
    `, [fecha]);

    return res.json({ success: true, visits: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error al obtener visitas por fecha' });
  }
}

async function getVisitasCalendarioResumen(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(v.fecha, 'YYYY-MM-DD') AS fecha,
        COUNT(*)::int AS total
      FROM VISITAS v
      GROUP BY v.fecha
      ORDER BY v.fecha ASC
    `);

    return res.json({ success: true, dates: result.rows });
  } catch (err) {
    console.error('Error al obtener el resumen del calendario:', err && err.message ? err.message : err);
    return res.json({ success: false, dates: [] });
  }
}

async function getVisitasEventos(req, res) {
  try {
    const result = await pool.query(`
      SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.estatus,
             TO_CHAR(v.fecha, 'YYYY-MM-DD') AS fecha_iso,
             TO_CHAR(v.hora, 'HH24:MI:SS') AS hora_iso,
             v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario, v.cordinacion_referida, v.observaciones,
             ${contactSelectSql('c')},
             c.cedula_rif, c.telefono, c.tipo_contacto,
             o.codigo_ot, o.detalle AS detalle_ot
      FROM VISITAS v
      LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
      LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
      ORDER BY v.fecha ASC, v.hora ASC
      LIMIT 1000
    `);

    const events = result.rows.map((visit) => {
      const datePart = visit.fecha_iso;
      const timePart = visit.hora_iso || '00:00:00';

      return {
        id: visit.codigo_visita,
        title: `${visit.tipo_visita} - ${visit.nombre_entidad || 'Sin entidad'}`,
        start: `${datePart}T${timePart}`,
        allDay: false,
        extendedProps: {
          codigo_visita: visit.codigo_visita,
          estatus: visit.estatus,
          cedula_rif: visit.cedula_rif || '',
          nombre_completo: visit.nombre_completo || '',
          entidad: visit.entidad || '',
          nombre_entidad: visit.nombre_entidad || '',
          telefono: visit.telefono || '',
          tipo_contacto: visit.tipo_contacto || '',
          sexo: visit.sexo || '',
          edad: visit.edad || '',
          municipio: visit.municipio || '',
          sector: visit.sector || '',
          cargo: visit.cargo || '',
          funcion: visit.funcion || '',
          actividad_economica: visit.actividad_economica || '',
          funcionario: visit.funcionario || '',
          motivo_visita: visit.motivo_visita || '',
          cordinacion_referida: visit.cordinacion_referida || '',
          observaciones: visit.observaciones || '',
          codigo_ot: visit.codigo_ot || '',
          detalle_ot: visit.detalle_ot || '',
          tipo_visita: visit.tipo_visita || '',
          hora: String(visit.hora_iso || '').slice(0, 5),
          fecha: visit.fecha_iso || ''
        }
      };
    });

    return res.json({ success: true, events });
  } catch (err) {
    console.error('Error al obtener eventos de visitas:', err && err.message ? err.message : err);
    return res.json({ success: false, events: [] });
  }
}

async function modifyVisit(req, res) {
  const {
    codigo_visita,
    fecha,
    hora,
    tipo_visita,
    motivo_visita,
    estatus,
    cedula_rif,
    nombre_completo,
    entidad,
    nombre_entidad,
    telefono,
    tipo_contacto,
    codigo_ot,
    detalle_ot,
    Sexo, Edad, municipio, sector, cargo, funcion, actividad_economica, Cordinacion_Referida, funcionario, observaciones
  } = req.body;
  const contactData = normalizeContactData({ nombre_completo, entidad, nombre_entidad, tipo_contacto });

  const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
  const errors = validateVisitBody(req.body);

  if (!codigo_visita) {
    const message = 'Código de visita es obligatorio para modificar.';
    return wantsJson ? res.status(400).json({ success: false, message }) : res.status(400).send(message);
  }

  if (errors.length > 0) {
    const message = `Errores de validación: ${errors.join(' ')}`;
    return wantsJson
      ? res.status(400).json({ success: false, message, errors })
      : res.status(400).send(message);
  }

  try {
    const visitCheck = await pool.query('SELECT id_orden FROM VISITAS WHERE codigo_visita = $1', [codigo_visita]);
    if (visitCheck.rows.length === 0) {
      const message = `Visita ${codigo_visita} no encontrada.`;
      return wantsJson ? res.status(404).json({ success: false, message }) : res.status(404).send(message);
    }

    let id_orden = visitCheck.rows[0].id_orden;

    let contactoResult = await pool.query(
      'SELECT id_contacto FROM CONTACTOS WHERE cedula_rif = $1',
      [cedula_rif]
    );

    let id_contacto;
    if (contactoResult.rows.length > 0) {
      id_contacto = contactoResult.rows[0].id_contacto;
      if (supportsSplitContactFields) {
        await pool.query(
          'UPDATE CONTACTOS SET nombre_completo = $1, entidad = $2, nombre_entidad = $3, telefono = $4, tipo_contacto = $5 WHERE id_contacto = $6',
          [contactData.nombre_completo || null, contactData.entidad || null, contactData.nombre_entidad, telefono, tipo_contacto, id_contacto]
        );
      } else {
        await pool.query(
          'UPDATE CONTACTOS SET nombre_entidad = $1, telefono = $2, tipo_contacto = $3 WHERE id_contacto = $4',
          [contactData.nombre_entidad, telefono, tipo_contacto, id_contacto]
        );
      }
    } else {
      const insertContacto = supportsSplitContactFields
        ? await pool.query(
          'INSERT INTO CONTACTOS (cedula_rif, nombre_completo, entidad, nombre_entidad, telefono, tipo_contacto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_contacto',
          [cedula_rif, contactData.nombre_completo || null, contactData.entidad || null, contactData.nombre_entidad, telefono, tipo_contacto]
        )
        : await pool.query(
          'INSERT INTO CONTACTOS (cedula_rif, nombre_entidad, telefono, tipo_contacto) VALUES ($1, $2, $3, $4) RETURNING id_contacto',
          [cedula_rif, contactData.nombre_entidad, telefono, tipo_contacto]
        );
      id_contacto = insertContacto.rows[0].id_contacto;
    }

    if (codigo_ot) {
      const ordenResult = await pool.query(
        'INSERT INTO ORDENES_TRABAJO (codigo_ot, detalle) VALUES ($1, $2) ON CONFLICT (codigo_ot) DO UPDATE SET detalle = EXCLUDED.detalle RETURNING id_orden',
        [codigo_ot, detalle_ot || '']
      );
      id_orden = ordenResult.rows[0].id_orden;
    }

    await pool.query(
      `UPDATE VISITAS SET
         fecha = $1,
         hora = $2,
         tipo_visita = $3,
         motivo_visita = $4,
         estatus = $5,
         cordinacion_referida = $6,
         observaciones = $7,
         sexo = $8,
         edad = $9,
         municipio = $10,
         sector = $11,
         cargo = $12,
         funcion = $13,
         actividad_economica = $14,
         funcionario = $15,
         id_contacto = $16,
         id_orden = $17
       WHERE codigo_visita = $18`,
      [fecha, hora, tipo_visita || 'Personal', motivo_visita || null, estatus, Cordinacion_Referida || null, observaciones || null, Sexo || null, Edad ? Number(Edad) : null, municipio || null, sector || null, cargo || null, funcion || null, actividad_economica || null, funcionario || null, id_contacto, id_orden, codigo_visita]
    );

    const message = `Visita ${codigo_visita} actualizada correctamente.`;
    if (wantsJson) {
      return res.json({ success: true, message, codigo_visita });
    }
    return res.redirect(303, `/success?code=${encodeURIComponent(codigo_visita)}`);
  } catch (err) {
    console.error(err);
    const message = `Error al modificar la visita: ${err.message}`;
    return wantsJson
      ? res.status(500).json({ success: false, message })
      : res.status(500).send(message);
  }
}

async function deleteVisit(req, res) {
  const { codigo_visita } = req.body;
  if (!codigo_visita) {
    return res.status(400).send(`
      <script>
        alert('Debe indicar el código de visita.');
        window.location.href = '/delete-visit';
      </script>
    `);
  }

  try {
    const result = await pool.query(
      'DELETE FROM VISITAS WHERE codigo_visita = $1 RETURNING *',
      [codigo_visita]
    );

    if (result.rowCount > 0) {
      return res.send(`
        <script>
          alert('Visita ${codigo_visita} eliminada con éxito.');
          window.location.href = '/menu';
        </script>
      `);
    }

    return res.send(`
      <script>
        alert('No se encontró ninguna visita con el código: ${codigo_visita}');
        window.location.href = '/delete-visit';
      </script>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send(`
      <script>
        alert('Error interno al intentar eliminar el registro.');
        window.location.href = '/delete-visit';
      </script>
    `);
  }
}

async function getVisitasReporte(req, res) {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros fecha_inicio y fecha_fin son requeridos.'
    });
  }

  try {
    const result = await pool.query(`
      SELECT v.codigo_visita, v.fecha, v.hora, v.tipo_visita, v.motivo_visita, v.estatus, v.cordinacion_referida, v.observaciones,
             v.sexo AS sexo, v.edad AS edad, v.municipio AS municipio, v.sector AS sector, v.cargo AS cargo, v.funcion AS funcion, v.actividad_economica AS actividad_economica, v.funcionario AS funcionario,
             ${contactSelectSql('c')},
             c.cedula_rif, c.telefono, c.tipo_contacto,
             o.codigo_ot, o.detalle AS detalle_ot
      FROM VISITAS v
      LEFT JOIN CONTACTOS c ON v.id_contacto = c.id_contacto
      LEFT JOIN ORDENES_TRABAJO o ON v.id_orden = o.id_orden
      WHERE v.fecha BETWEEN $1::date AND $2::date
      ORDER BY v.fecha ASC, v.hora ASC
    `, [fecha_inicio, fecha_fin]);

    return res.json({ success: true, visits: result.rows });
  } catch (err) {
    console.error('Error al obtener reporte de visitas:', err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: 'Error interno al obtener el reporte de visitas.' });
  }
}

module.exports = {
  requireContactColumns,
  registerVisit,
  getVisitas,
  getRecentVisitas,
  getVisitasDelDia,
  getVisitasPorFecha,
  getVisitasCalendarioResumen,
  getVisitasEventos,
  modifyVisit,
  deleteVisit,
  getVisitasReporte,
};
