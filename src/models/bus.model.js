const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busId: {
  type: String,
  required: true,
  unique: true
},
  busNumber: { type: String, required: true },

  source: { type: String, required: true },
  destination: { type: String, required: true },

  // ✅ ADD HERE
  routeStops: {
    type: [String],
    required: true
  },

  departureTime: { type: String, required: true },
  seatsAvailable: { type: Number, required: true },

  currentLocation: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },

  locationHistory: {
    type: [
      {
        latitude: Number,
        longitude: Number,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    default: []
  }

}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);