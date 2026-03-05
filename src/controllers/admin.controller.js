const Admin = require("../models/admin.model");
const Driver = require("../models/driver.model");
const Bus = require("../models/bus.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Admin
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword });
    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login Admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all drivers (protected)
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("assignedBus");
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all buses (protected)
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate("assignedDriver");
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign driver to bus (protected)
exports.assignDriver = async (req, res) => {
  try {
    const { driverId, busId } = req.body;
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    
    // Check if driver already assigned
    if (driver.assignedBus) {
      return res.status(400).json({ message: "Driver already assigned to a bus" });
    }
    
    // Check if bus already has driver
    if (bus.assignedDriver) {
      return res.status(400).json({ message: "Bus already has a driver" });
    }
    
    driver.assignedBus = busId;
    bus.assignedDriver = driverId;
    
    await driver.save();
    await bus.save();
    
    res.json({ message: "Driver assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unassigned drivers
exports.getUnassignedDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ assignedBus: null });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unassigned buses
exports.getUnassignedBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ assignedDriver: null });
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};