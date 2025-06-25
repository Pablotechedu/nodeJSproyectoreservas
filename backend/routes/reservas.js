const express = require("express");
const router = express.Router();
const {
  getMisReservas,
  getAllReservas,
  createReserva,
  updateReserva,
  cancelReserva,
  getDisponibilidad,
} = require("../controllers/reservaController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateReserva } = require("../middleware/validation");

router.get("/mis-reservas", authenticateToken, getMisReservas);
router.get("/", authenticateToken, requireAdmin, getAllReservas);
router.post("/", authenticateToken, validateReserva, createReserva);
router.put("/:id", authenticateToken, updateReserva);
router.delete("/:id", authenticateToken, cancelReserva);

// Ruta de disponibilidad simplificada
router.get("/disponibilidad/:espacioId/:fecha", (req, res) => {
  res.json({ message: "Ruta de disponibilidad funcionando" });
});

module.exports = router;
