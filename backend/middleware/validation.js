// Validaciones básicas para los datos
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateReserva = (req, res, next) => {
  const { id_espacio, fecha_reserva, hora_inicio, hora_fin } = req.body;

  // Validar campos requeridos
  if (!id_espacio || !fecha_reserva || !hora_inicio || !hora_fin) {
    return res.status(400).json({
      error:
        "Todos los campos son requeridos: id_espacio, fecha_reserva, hora_inicio, hora_fin",
    });
  }

  // Validar que la fecha no sea en el pasado
  const fechaReserva = new Date(fecha_reserva);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaReserva < hoy) {
    return res.status(400).json({
      error: "No se pueden hacer reservas en fechas pasadas",
    });
  }

  // Validar que hora_fin sea mayor que hora_inicio
  if (hora_fin <= hora_inicio) {
    return res.status(400).json({
      error: "La hora de fin debe ser mayor que la hora de inicio",
    });
  }

  next();
};

const validateUser = (req, res, next) => {
  const { nombre, apellido, email, contraseña } = req.body;

  if (!nombre || !apellido || !email || !contraseña) {
    return res.status(400).json({
      error:
        "Todos los campos son requeridos: nombre, apellido, email, contraseña",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      error: "Email inválido",
    });
  }

  if (!validatePassword(contraseña)) {
    return res.status(400).json({
      error: "La contraseña debe tener al menos 6 caracteres",
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateReserva,
  validateUser,
};
