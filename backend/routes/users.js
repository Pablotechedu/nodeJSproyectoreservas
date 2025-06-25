const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getProfile,
  updateProfile,
  changePassword,
  deleteUser,
} = require("../controllers/userController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.get("/", authenticateToken, requireAdmin, getAllUsers);
router.delete("/:id", authenticateToken, requireAdmin, deleteUser);

module.exports = router;
