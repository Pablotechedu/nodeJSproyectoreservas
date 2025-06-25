const express = require("express");
const router = express.Router();
const {
  getEspacios,
  getEspacioById,
  createEspacio,
  getTiposEspacio,
  updateEspacio,
  deleteEspacio,
} = require("../controllers/espacioController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.get("/", getEspacios);
router.get("/tipos", getTiposEspacio);
router.get("/:id", getEspacioById);
router.post("/", authenticateToken, requireAdmin, createEspacio);
router.put("/:id", authenticateToken, requireAdmin, updateEspacio);
router.delete("/:id", authenticateToken, requireAdmin, deleteEspacio);

module.exports = router;
