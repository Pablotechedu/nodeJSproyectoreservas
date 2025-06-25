const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const { generateToken } = require("../config/jwt");

// Registro de usuario
const register = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      contraseña,
      telefono,
      tipo_usuario = 2,
    } = req.body;

    // Verificar si el email ya existe
    const emailExists = await pool.query(
      'SELECT * FROM "Usuario" WHERE "Email" = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

    // Insertar nuevo usuario
    const newUser = await pool.query(
      `INSERT INTO "Usuario" ("Nombre", "Apellido", "Email", "Contraseña", "Teléfono", "Tipo_usuario") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING "ID_Usuario", "Nombre", "Apellido", "Email", "Tipo_usuario"`,
      [nombre, apellido, email, hashedPassword, telefono, tipo_usuario]
    );

    const user = newUser.rows[0];

    // Generar token
    const token = generateToken({
      id_usuario: user.ID_Usuario,
      email: user.Email,
      tipo_usuario: user.Tipo_usuario,
    });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: user.ID_Usuario,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Email,
        tipo_usuario: user.Tipo_usuario,
      },
      token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar usuario por email
    const userResult = await pool.query(
      'SELECT * FROM "Usuario" WHERE "Email" = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(contraseña, user.Contraseña);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = generateToken({
      id_usuario: user.ID_Usuario,
      email: user.Email,
      tipo_usuario: user.Tipo_usuario,
    });

    res.json({
      message: "Login exitoso",
      user: {
        id: user.ID_Usuario,
        nombre: user.Nombre,
        apellido: user.Apellido,
        email: user.Email,
        tipo_usuario: user.Tipo_usuario,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  register,
  login,
};
