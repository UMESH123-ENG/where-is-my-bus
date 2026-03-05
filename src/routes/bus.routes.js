const express = require("express");
const router = express.Router();
const busController = require("../controllers/bus.controller");
const authMiddleware = require("../middleware/auth.middleware");
const driverAuth = require("../middleware/driverAuth.middleware");

// Public routes
router.get("/", busController.getBuses);
router.get("/search", busController.searchBuses);
router.get("/history/:id", busController.getLocationHistory);
router.get("/distance/:id", busController.getTotalDistance);
console.log(typeof busController.searchBuses);
router.get("/:id", busController.getBusById);
// Admin routes
router.post("/add", authMiddleware, busController.addBus);
router.put("/update/:id", authMiddleware, busController.updateBus);
router.delete("/delete/:id", authMiddleware, busController.deleteBus);

// Driver routes
router.put("/location", driverAuth, busController.updateLocation);

// Simulation
router.post("/simulate/:id", busController.startSimulation);
router.post("/stop/:id", busController.stopSimulation);
router.get("/eta/:id", busController.getETA);
router.post("/calculate-route/:id", busController.calculateHighwayRoute);
module.exports = router;