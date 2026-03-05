const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // 🔥 ONE driver → ONE bus (automatic)
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true  // Every driver MUST have a bus
  },
  
  status: {
    type: String,
    enum: ["available", "on_duty", "off_duty"],
    default: "available"
  },
  
  lastLogin: { type: Date },
  lastLogout: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);