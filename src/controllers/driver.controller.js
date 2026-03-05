const Driver = require("../models/driver.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Driver
exports.registerDriver = async (req, res) => {
  try {
    const { name, phone, password, assignedBus } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new Driver({
      name,
      phone,
      password: hashedPassword,
      assignedBus
    });

    await driver.save();

    res.status(201).json({ message: "Driver registered successfully" });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Driver Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find driver
    const driver = await Driver.findOne({ email }).populate("assignedBus");
    
    if (!driver) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, driver.password);
    if (!validPassword) {
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Check if driver has assigned bus
    if (!driver.assignedBus) {
      return res.status(403).json({ 
        message: "No bus assigned. Contact admin." 
      });
    }

    // 🔥 NEW: Update bus status to active
    await Bus.findByIdAndUpdate(driver.assignedBus._id, {
      status: "active",
      $set: {
        "currentLocation.latitude": 0, // Reset location (will update with GPS)
        "currentLocation.longitude": 0,
        "currentLocation.updatedAt": Date.now()
      }
    });

    // Update driver status
    driver.status = "on_duty";
    driver.lastLogin = new Date();
    driver.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip
    });
    await driver.save();

    // Create token
    const token = jwt.sign(
      { 
        id: driver._id,
        role: "driver",
        assignedBus: driver.assignedBus._id
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      message: "Login successful",
      token,
      driver: {
        name: driver.name,
        busNumber: driver.assignedBus.busNumber,
        route: `${driver.assignedBus.source} → ${driver.assignedBus.destination}`,
        stops: driver.assignedBus.stops
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Driver Logout
exports.logout = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.id).populate("assignedBus");
    
    if (driver) {
      // 🔥 NEW: Mark bus as inactive
      if (driver.assignedBus) {
        await Bus.findByIdAndUpdate(driver.assignedBus._id, {
          status: "inactive",
          $set: {
            "currentLocation.latitude": 0,
            "currentLocation.longitude": 0
          }
        });
      }
      
      driver.status = "available";
      await driver.save();
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};