const jwt = require("jsonwebtoken");
const Driver = require("../models/driver.model");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const driver = await Driver.findById(decoded.id);
    
    if (!driver || driver.status !== "on_duty") {
      return res.status(401).json({ message: "Invalid session" });
    }

    // 🔥 IMPORTANT: Set busId in req.driver
    req.driver = {
      id: driver._id,
      busId: driver.assignedBus // Make sure this is set!
    };

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};