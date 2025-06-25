const { pool } = require("../config/database");

// Obtener reservas del usuario actual
const getMisReservas = async (req, res) => {
  try {
    const userId = req.user.id_usuario;

    const result = await pool.query(
      `
      SELECT 
        r.id_reserva,
        r.fecha_reserva,
        r.hora_inicio,
        r.hora_fin,
        r.observaciones,
        e."Nombre" as espacio_nombre,
        e."Ubicación" as espacio_ubicacion,
        te."Nombre" as tipo_espacio,
        er."Estado" as estado_reserva
      FROM "Reserva" r
      JOIN "Espacio" e ON r.id_espacio = e."ID_Espacio"
      JOIN "Tipo_Espacio" te ON e."Tipo_espacio" = te."Tipo_espacio"
      JOIN "Estado_Reserva" er ON r.estado_reserva = er.estado_reserva
      WHERE r.id_usuario = $1
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo mis reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todas las reservas (solo admin)
const getAllReservas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id_reserva,
        r.fecha_reserva,
        r.hora_inicio,
        r.hora_fin,
        r.observaciones,
        u."Nombre" || ' ' || u."Apellido" as usuario_nombre,
        u."Email" as usuario_email,
        e."Nombre" as espacio_nombre,
        e."Ubicación" as espacio_ubicacion,
        te."Nombre" as tipo_espacio,
        er."Estado" as estado_reserva
      FROM "Reserva" r
      JOIN "Usuario" u ON r.id_usuario = u."ID_Usuario"
      JOIN "Espacio" e ON r.id_espacio = e."ID_Espacio"
      JOIN "Tipo_Espacio" te ON e."Tipo_espacio" = te."Tipo_espacio"
      JOIN "Estado_Reserva" er ON r.estado_reserva = er.estado_reserva
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo todas las reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear nueva reserva
const createReserva = async (req, res) => {
  try {
    const { id_espacio, fecha_reserva, hora_inicio, hora_fin, observaciones } =
      req.body;
    const userId = req.user.id_usuario;

    // Verificar que el espacio existe y está activo
    const espacioResult = await pool.query(
      `
      SELECT * FROM "Espacio" WHERE "ID_Espacio" = $1 AND "Estado" = true
    `,
      [id_espacio]
    );

    if (espacioResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Espacio no encontrado o no disponible" });
    }

    const espacio = espacioResult.rows[0];

    // Validar horarios de operación
    const fechaReserva = new Date(fecha_reserva + "T12:00:00");
    const diaSemana = fechaReserva.getDay(); // 0 = domingo, 6 = sábado

    // Verificar si es domingo (no hay servicio)
    if (diaSemana === 0) {
      return res.status(400).json({ error: "No hay servicio los domingos" });
    }

    // Verificar horarios según el día
    const horaApertura = espacio.Hora_apertura;
    const horaCierre =
      diaSemana === 6 ? espacio.Hora_cierre_sabado : espacio.Hora_cierre_lv;

    if (hora_inicio < horaApertura || hora_fin > horaCierre) {
      return res.status(400).json({
        error: `El espacio opera de ${horaApertura} a ${horaCierre}`,
      });
    }

    // Verificar solapamiento con otras reservas
    const solapamiento = await pool.query(
      `
      SELECT * FROM "Reserva" 
      WHERE id_espacio = $1 
        AND fecha_reserva = $2 
        AND estado_reserva IN (1, 2)
        AND (
          (hora_inicio < $4 AND hora_fin > $3) OR
          (hora_inicio < $3 AND hora_fin > $3) OR
          (hora_inicio < $4 AND hora_fin > $4)
        )
    `,
      [id_espacio, fecha_reserva, hora_inicio, hora_fin]
    );

    if (solapamiento.rows.length > 0) {
      return res.status(400).json({
        error: "Ya existe una reserva en ese horario",
      });
    }

    // Crear la reserva
    const result = await pool.query(
      `
      INSERT INTO "Reserva" (id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [userId, id_espacio, fecha_reserva, hora_inicio, hora_fin, observaciones]
    );

    res.status(201).json({
      message: "Reserva creada exitosamente",
      reserva: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar reserva
const updateReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_reserva, hora_inicio, hora_fin, observaciones } = req.body;
    const userId = req.user.id_usuario;
    const isAdmin = req.user.tipo_usuario === 1;

    // Verificar que la reserva existe
    const reservaResult = await pool.query(
      `
      SELECT * FROM "Reserva" WHERE id_reserva = $1
    `,
      [id]
    );

    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reserva = reservaResult.rows[0];

    // Verificar permisos (solo el dueño de la reserva o admin)
    if (!isAdmin && reserva.id_usuario !== userId) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para modificar esta reserva" });
    }

    // Si se cambian fecha/hora, verificar solapamientos
    if (fecha_reserva || hora_inicio || hora_fin) {
      const nuevaFecha = fecha_reserva || reserva.fecha_reserva;
      const nuevaHoraInicio = hora_inicio || reserva.hora_inicio;
      const nuevaHoraFin = hora_fin || reserva.hora_fin;

      const solapamiento = await pool.query(
        `
        SELECT * FROM "Reserva" 
        WHERE id_espacio = $1 
          AND fecha_reserva = $2 
          AND id_reserva != $3
          AND estado_reserva IN (1, 2)
          AND (
            (hora_inicio < $5 AND hora_fin > $4) OR
            (hora_inicio < $4 AND hora_fin > $4) OR
            (hora_inicio < $5 AND hora_fin > $5)
          )
      `,
        [reserva.id_espacio, nuevaFecha, id, nuevaHoraInicio, nuevaHoraFin]
      );

      if (solapamiento.rows.length > 0) {
        return res.status(400).json({
          error: "Ya existe una reserva en ese horario",
        });
      }
    }

    // Actualizar la reserva
    const result = await pool.query(
      `
      UPDATE "Reserva" 
      SET fecha_reserva = COALESCE($1, fecha_reserva),
          hora_inicio = COALESCE($2, hora_inicio),
          hora_fin = COALESCE($3, hora_fin),
          observaciones = COALESCE($4, observaciones)
      WHERE id_reserva = $5
      RETURNING *
    `,
      [fecha_reserva, hora_inicio, hora_fin, observaciones, id]
    );

    res.json({
      message: "Reserva actualizada exitosamente",
      reserva: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Cancelar reserva
const cancelReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_usuario;
    const isAdmin = req.user.tipo_usuario === 1;

    // Verificar que la reserva existe
    const reservaResult = await pool.query(
      `
      SELECT * FROM "Reserva" WHERE id_reserva = $1
    `,
      [id]
    );

    if (reservaResult.rows.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reserva = reservaResult.rows[0];

    // Verificar permisos (solo el dueño de la reserva o admin)
    if (!isAdmin && reserva.id_usuario !== userId) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para cancelar esta reserva" });
    }

    // Cambiar estado a cancelada (3)
    const result = await pool.query(
      `
      UPDATE "Reserva" 
      SET estado_reserva = 3
      WHERE id_reserva = $1
      RETURNING *
    `,
      [id]
    );

    res.json({
      message: "Reserva cancelada exitosamente",
      reserva: result.rows[0],
    });
  } catch (error) {
    console.error("Error cancelando reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener disponibilidad de un espacio en una fecha
const getDisponibilidad = async (req, res) => {
  try {
    const { espacioId, fecha } = req.params;

    // Obtener horarios del espacio
    const espacioResult = await pool.query(
      `
      SELECT "Hora_apertura", "Hora_cierre_lv", "Hora_cierre_sabado" 
      FROM "Espacio" WHERE "ID_Espacio" = $1
    `,
      [espacioId]
    );

    if (espacioResult.rows.length === 0) {
      return res.status(404).json({ error: "Espacio no encontrado" });
    }

    // Obtener reservas existentes para esa fecha
    const reservasResult = await pool.query(
      `
      SELECT hora_inicio, hora_fin 
      FROM "Reserva" 
      WHERE id_espacio = $1 AND fecha_reserva = $2 AND estado_reserva IN (1, 2)
      ORDER BY hora_inicio
    `,
      [espacioId, fecha]
    );

    res.json({
      horarios_espacio: espacioResult.rows[0],
      reservas_existentes: reservasResult.rows,
    });
  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  getMisReservas,
  getAllReservas,
  createReserva,
  updateReserva,
  cancelReserva,
  getDisponibilidad,
};
