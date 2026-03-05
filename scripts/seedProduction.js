const mongoose = require("mongoose");
const Stop = require("../src/models/stop.model");
const Route = require("../src/models/route.model");
const Bus = require("../src/models/bus.model");
const Driver = require("../src/models/driver.model");
const Admin = require("../src/models/admin.model");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedProduction() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Create default admin if not exists
    const adminExists = await Admin.findOne({ email: "admin@haryanaroadways.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await Admin.create({
        email: "admin@haryanaroadways.com",
        password: hashedPassword
      });
      console.log("✅ Default admin created");
    }

    console.log("🎯 Production data ready!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedProduction();