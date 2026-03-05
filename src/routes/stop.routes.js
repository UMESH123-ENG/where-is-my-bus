const express = require("express");
const router = express.Router();
const stopController = require("../controllers/stop.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Public routes
router.get("/", stopController.getAllStops);
router.get("/search", stopController.searchStops);
router.get("/:id", stopController.getStopById);

// Admin routes
router.post("/add", authMiddleware, stopController.addStop);
router.put("/update/:id", authMiddleware, stopController.updateStop);
router.delete("/delete/:id", authMiddleware, stopController.deleteStop);

module.exports = router;