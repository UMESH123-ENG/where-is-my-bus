const Stop = require("../models/stop.model");

// Get all stops
exports.getAllStops = async (req, res) => {
  try {
    const stops = await Stop.find().sort({ displayName: 1 });
    res.json(stops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stop by ID
exports.getStopById = async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: "Stop not found" });
    }
    res.json(stop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new stop (admin only)
exports.addStop = async (req, res) => {
  try {
    const stop = new Stop(req.body);
    const savedStop = await stop.save();
    res.status(201).json(savedStop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update stop
exports.updateStop = async (req, res) => {
  try {
    const updatedStop = await Stop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStop) {
      return res.status(404).json({ message: "Stop not found" });
    }
    res.json(updatedStop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete stop
exports.deleteStop = async (req, res) => {
  try {
    const stop = await Stop.findByIdAndDelete(req.params.id);
    if (!stop) {
      return res.status(404).json({ message: "Stop not found" });
    }
    res.json({ message: "Stop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search stops
exports.searchStops = async (req, res) => {
  try {
    const { query } = req.query;
    const stops = await Stop.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
        { district: { $regex: query, $options: "i" } }
      ]
    }).limit(20);
    res.json(stops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};