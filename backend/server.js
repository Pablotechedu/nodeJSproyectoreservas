const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");

// Importar rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const espacioRoutes = require("./routes/espacios");
const reservaRoutes = require("./routes/reservas");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ RUTA DE HEALTH CHECK PRIMERO
app.get("/api/health", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// ✅ LUEGO LAS RUTAS ESPECÍFICAS
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/espacios", espacioRoutes);
app.use("/api/reservas", reservaRoutes);

// ✅ MIDDLEWARE DE RUTAS NO ENCONTRADAS AL FINAL
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    app.listen(PORT, () => {
      console.log(` Servidor corriendo en puerto ${PORT}`);
      console.log(` API disponible en: http://localhost:${PORT}/api`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(" Error iniciando servidor:", error);
    process.exit(1);
  }
};

startServer();
