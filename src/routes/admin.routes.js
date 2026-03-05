const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Public routes
router.post("/register", adminController.register);
router.post("/login", adminController.login);

// Protected routes (require admin auth)
router.get("/drivers", authMiddleware, adminController.getDrivers);
router.get("/buses", authMiddleware, adminController.getBuses);
router.post("/assign-driver", authMiddleware, adminController.assignDriver);
router.get("/unassigned-drivers", authMiddleware, adminController.getUnassignedDrivers);
router.get("/unassigned-buses", authMiddleware, adminController.getUnassignedBuses);

module.exports = router;