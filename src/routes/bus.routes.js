const express = require("express");
const router = express.Router();
const busController = require("../controllers/bus.controller");
const authMiddleware = require("../middleware/auth.middleware");
const driverAuth = require("../middleware/driverAuth.middleware");

// Public
router.get("/", busController.getBuses);
router.get("/search", busController.searchBuses);
router.get("/:id", busController.getBusById);
router.post("/simulate/:id", busController.startSimulation);
// Admin protected
router.post("/add", authMiddleware, busController.addBus);
router.put("/update/:id", authMiddleware, busController.updateBus);
router.delete("/delete/:id", authMiddleware, busController.deleteBus);

// Driver update
router.put("/location", driverAuth, busController.updateLocation);

module.exports = router;