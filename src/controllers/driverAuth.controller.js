const Driver = require("../models/driver.model");
const Bus = require("../models/bus.model"); // 🔥 IMPORTANT: Bus model required!
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Driver Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔍 Login attempt for:", email);

    // Find driver and populate assignedBus AND its route
    const driver = await Driver.findOne({ email }).populate({
      path: "assignedBus",
      populate: {
        path: "route",
        populate: {
          path: "stops.stop",
          model: "Stop"
        }
      }
    });

    if (!driver) {
      console.log("❌ Driver not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Driver found:", driver.name);
    console.log("📦 Assigned bus ID:", driver.assignedBus?._id);
    console.log("📦 Assigned bus number:", driver.assignedBus?.busNumber);

    // Check password
    const validPassword = await bcrypt.compare(password, driver.password);
    if (!validPassword) {
      console.log("❌ Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if driver has assigned bus
    if (!driver.assignedBus) {
      console.log("❌ No bus assigned");
      return res.status(403).json({ message: "No bus assigned. Contact admin." });
    }

    // 🔥 CRITICAL: Update bus status to active
    console.log("🔄 Setting bus status to active for bus:", driver.assignedBus.busNumber);
    
    const updatedBus = await Bus.findByIdAndUpdate(
      driver.assignedBus._id,
      { 
        status: "active",
        $set: {
          "currentLocation.latitude": 29.3250, // Jind coordinates
          "currentLocation.longitude": 76.3120,
          "currentLocation.updatedAt": new Date()
        }
      },
      { new: true }
    );

    if (!updatedBus) {
      console.log("❌ Failed to update bus!");
    } else {
      console.log("✅ Bus status updated to:", updatedBus.status);
      console.log("✅ Bus number:", updatedBus.busNumber);
    }

    // Update driver status
    driver.status = "on_duty";
    driver.lastLogin = new Date();
    await driver.save();

    console.log("✅ Driver status updated to on_duty");

    // Create token
    const token = jwt.sign(
      { 
        id: driver._id,
        role: "driver",
        busId: driver.assignedBus._id,
        busNumber: driver.assignedBus.busNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Get route information from the bus
    const bus = driver.assignedBus;
    const route = bus.route;

    // Send response with route data
    res.json({
      message: "Login successful",
      token,
      driver: {
        name: driver.name,
        busNumber: bus.busNumber,
        // Use route data instead of direct bus fields
        route: route ? `${route.fromCityDisplay} → ${route.toCityDisplay}` : "No route assigned",
        stops: route ? route.stops.map(s => s.stopDisplayName) : [],
        departureTime: bus.departureTime
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
// Driver Logout
exports.logout = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.id).populate("assignedBus");
    
    if (driver && driver.assignedBus) {
      // Set bus status to inactive
      await Bus.findByIdAndUpdate(driver.assignedBus._id, {
        status: "inactive"
      });
      
      driver.status = "available";
      driver.lastLogout = new Date();
      await driver.save();
      
      console.log(`✅ Bus ${driver.assignedBus.busNumber} set to inactive`);
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: error.message });
  }
};

/// Get Driver Profile
exports.profile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.id)
      .populate({
        path: "assignedBus",
        populate: {
          path: "route",
          populate: {
            path: "stops.stop",
            model: "Stop"
          }
        }
      });
    
    const bus = driver.assignedBus;
    const route = bus?.route;
    
    res.json({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      status: driver.status,
      assignedBus: bus ? {
        busNumber: bus.busNumber,
        route: route ? `${route.fromCityDisplay} → ${route.toCityDisplay}` : "No route",
        stops: route ? route.stops.map(s => s.stopDisplayName) : [],
        departureTime: bus.departureTime
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Driver Registration
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, busNumber } = req.body;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingDriver) {
      return res.status(400).json({ 
        message: "Driver with this email or phone already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find bus if busNumber provided
    let assignedBus = null;
    if (busNumber) {
      const bus = await Bus.findOne({ busNumber });
      if (bus) {
        // Check if bus already has a driver
        if (bus.assignedDriver) {
          return res.status(400).json({ 
            message: "This bus already has a driver assigned" 
          });
        }
        assignedBus = bus._id;
      }
    }

    // Create new driver
    const driver = new Driver({
      name,
      phone,
      email,
      password: hashedPassword,
      assignedBus: assignedBus,
      status: "available"
    });

    await driver.save();

    // If bus was assigned, update bus with driver ID
    if (assignedBus) {
      await Bus.findByIdAndUpdate(assignedBus, {
        assignedDriver: driver._id
      });
    }

    res.status(201).json({
      message: "Driver registered successfully",
      driver: {
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        assignedBus: busNumber || "Not assigned yet"
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};