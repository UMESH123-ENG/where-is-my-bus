const express = require("express");
const router = express.Router();
const Route = require("../models/route.model");
const authMiddleware = require("../middleware/auth.middleware");

// ==================== PUBLIC ROUTES ====================

// Get all routes
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find().populate("stops.stop");
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get route by ID
router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("stops.stop");
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search routes between cities
router.get("/search/:from/:to", async (req, res) => {
  try {
    const { from, to } = req.params;
    
    const routes = await Route.find({
      "stops.stopName": { $all: [from.toLowerCase(), to.toLowerCase()] }
    }).populate("stops.stop");

    // Filter where from comes before to
    const validRoutes = routes.filter(route => {
      const fromStop = route.stops.find(s => s.stopName === from.toLowerCase());
      const toStop = route.stops.find(s => s.stopName === to.toLowerCase());
      return fromStop && toStop && fromStop.stopOrder < toStop.stopOrder;
    });

    res.json(validRoutes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN ROUTES (Protected) ====================

// Add new route
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const route = new Route(req.body);
    const savedRoute = await route.save();
    res.status(201).json(savedRoute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update route
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(updatedRoute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete route
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;