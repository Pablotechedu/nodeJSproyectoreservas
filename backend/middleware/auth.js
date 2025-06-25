const { verifyToken } = require("../config/jwt");

// Middleware para verificar autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Token de acceso requerido",
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Token inválido o expirado",
    });
  }
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
  if (req.user.tipo_usuario !== 1) {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de administrador",
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
