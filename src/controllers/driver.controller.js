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

// Login Driver
exports.loginDriver = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const driver = await Driver.findOne({ phone });

    if (!driver) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: driver._id, busId: driver.assignedBus },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
