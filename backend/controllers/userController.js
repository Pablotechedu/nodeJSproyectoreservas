const { pool } = require("../config/database");
const bcrypt = require("bcrypt");

// Obtener todos los usuarios (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u."ID_Usuario",
        u."Nombre",
        u."Apellido",
        u."Email",
        u."Teléfono",
        u."Fecha_registro",
        tu."Nombre" as tipo_usuario
      FROM "Usuario" u
      JOIN "Tipo_Usuario" tu ON u."Tipo_usuario" = tu."Tipo_usuario"
      ORDER BY u."Fecha_registro" DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener perfil del usuario actual
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id_usuario;

    const result = await pool.query(
      `
      SELECT 
        u."ID_Usuario",
        u."Nombre",
        u."Apellido",
        u."Email",
        u."Teléfono",
        u."Fecha_registro",
        tu."Nombre" as tipo_usuario
      FROM "Usuario" u
      JOIN "Tipo_Usuario" tu ON u."Tipo_usuario" = tu."Tipo_usuario"
      WHERE u."ID_Usuario" = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { nombre, apellido, telefono } = req.body;

    const result = await pool.query(
      `
      UPDATE "Usuario" 
      SET "Nombre" = COALESCE($1, "Nombre"),
          "Apellido" = COALESCE($2, "Apellido"),
          "Teléfono" = COALESCE($3, "Teléfono")
      WHERE "ID_Usuario" = $4
      RETURNING "ID_Usuario", "Nombre", "Apellido", "Email", "Teléfono"
    `,
      [nombre, apellido, telefono, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Perfil actualizado exitosamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { contraseña_actual, contraseña_nueva } = req.body;

    if (!contraseña_actual || !contraseña_nueva) {
      return res.status(400).json({
        error: "Contraseña actual y nueva son requeridas",
      });
    }

    if (contraseña_nueva.length < 6) {
      return res.status(400).json({
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    // Obtener contraseña actual del usuario
    const userResult = await pool.query(
      `
      SELECT "Contraseña" FROM "Usuario" WHERE "ID_Usuario" = $1
    `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(
      contraseña_actual,
      userResult.rows[0].Contraseña
    );

    if (!validPassword) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(contraseña_nueva, saltRounds);

    // Actualizar contraseña
    await pool.query(
      `
      UPDATE "Usuario" SET "Contraseña" = $1 WHERE "ID_Usuario" = $2
    `,
      [hashedNewPassword, userId]
    );

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario tiene reservas activas
    const reservasActivas = await pool.query(
      `
      SELECT COUNT(*) FROM "Reserva" 
      WHERE "id_usuario" = $1 AND "estado_reserva" IN (1, 2)
    `,
      [id]
    );

    if (parseInt(reservasActivas.rows[0].count) > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el usuario porque tiene reservas activas",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM "Usuario" WHERE "ID_Usuario" = $1 RETURNING "Email"
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  getAllUsers,
  getProfile,
  updateProfile,
  changePassword,
  deleteUser,
};
