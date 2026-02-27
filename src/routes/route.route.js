const express = require("express");
const router = express.Router();
const Route = require("../models/route.model");

// Add route
router.post("/add", async (req, res) => {
  try {
    const route = new Route(req.body);
    const savedRoute = await route.save();
    res.status(201).json(savedRoute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
