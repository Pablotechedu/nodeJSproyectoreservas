const { pool } = require("../config/database");

// Obtener todos los espacios
const getEspacios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e."ID_Espacio",
        e."Nombre",
        e."Capacidad",
        e."Ubicación",
        e."Estado",
        e."Descripción",
        e."Hora_apertura",
        e."Hora_cierre_lv",
        e."Hora_cierre_sabado",
        te."Nombre" as tipo_espacio
      FROM "Espacio" e
      JOIN "Tipo_Espacio" te ON e."Tipo_espacio" = te."Tipo_espacio"
      WHERE e."Estado" = true
      ORDER BY e."Nombre"
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo espacios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener un espacio por ID
const getEspacioById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        e."ID_Espacio",
        e."Nombre",
        e."Capacidad",
        e."Ubicación",
        e."Estado",
        e."Descripción",
        e."Hora_apertura",
        e."Hora_cierre_lv",
        e."Hora_cierre_sabado",
        te."Nombre" as tipo_espacio
      FROM "Espacio" e
      JOIN "Tipo_Espacio" te ON e."Tipo_espacio" = te."Tipo_espacio"
      WHERE e."ID_Espacio" = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Espacio no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo espacio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear nuevo espacio (solo admin)
const createEspacio = async (req, res) => {
  try {
    const { nombre, tipo_espacio, capacidad, ubicacion, descripcion } =
      req.body;

    if (!nombre || !tipo_espacio || !capacidad || !ubicacion) {
      return res.status(400).json({
        error: "Campos requeridos: nombre, tipo_espacio, capacidad, ubicacion",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO "Espacio" ("Nombre", "Tipo_espacio", "Capacidad", "Ubicación", "Descripción")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [nombre, tipo_espacio, capacidad, ubicacion, descripcion]
    );

    res.status(201).json({
      message: "Espacio creado exitosamente",
      espacio: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando espacio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener tipos de espacio
const getTiposEspacio = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM "Tipo_Espacio" ORDER BY "Nombre"
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo tipos de espacio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar espacio (solo admin)
const updateEspacio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo_espacio, capacidad, ubicacion, estado, descripcion } =
      req.body;

    const result = await pool.query(
      `
      UPDATE "Espacio" 
      SET "Nombre" = $1, "Tipo_espacio" = $2, "Capacidad" = $3, 
          "Ubicación" = $4, "Estado" = $5, "Descripción" = $6
      WHERE "ID_Espacio" = $7
      RETURNING *
    `,
      [nombre, tipo_espacio, capacidad, ubicacion, estado, descripcion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Espacio no encontrado" });
    }

    res.json({
      message: "Espacio actualizado exitosamente",
      espacio: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando espacio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar espacio (solo admin)
const deleteEspacio = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay reservas activas para este espacio
    const reservasActivas = await pool.query(
      `
      SELECT COUNT(*) FROM "Reserva" 
      WHERE "id_espacio" = $1 AND "estado_reserva" IN (1, 2)
    `,
      [id]
    );

    if (parseInt(reservasActivas.rows[0].count) > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el espacio porque tiene reservas activas",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM "Espacio" WHERE "ID_Espacio" = $1 RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Espacio no encontrado" });
    }

    res.json({ message: "Espacio eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando espacio:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  getEspacios,
  getEspacioById,
  createEspacio,
  getTiposEspacio,
  updateEspacio,
  deleteEspacio,
};
