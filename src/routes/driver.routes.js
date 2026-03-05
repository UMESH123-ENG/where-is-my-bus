const express = require("express");
const router = express.Router();
const driverAuth = require("../controllers/driverAuth.controller");
const busController = require("../controllers/bus.controller"); // 🔥 ADD THIS!
const authMiddleware = require("../middleware/driverAuth.middleware");

// Public routes
router.post("/register", driverAuth.register);
router.post("/login", driverAuth.login);

// Protected routes
router.post("/logout", authMiddleware, driverAuth.logout);
router.get("/profile", authMiddleware, driverAuth.profile);

// Bus status route for drivers
router.put("/status", authMiddleware, busController.updateBusStatus); // 🔥 Now busController is defined

module.exports = router;