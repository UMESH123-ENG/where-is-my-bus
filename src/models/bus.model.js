const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Reference to route instead of storing stops directly
  route: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Route",
    required: true 
  },
  
  // Driver assigned to this bus
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null
  },
  
  // Schedule
  departureTime: { 
    type: String, 
    required: true 
  },
  
  arrivalTime: { 
    type: String, 
    required: true 
  },
  
  // Capacity
  totalSeats: { 
    type: Number, 
    default: 40 
  },
  
  seatsAvailable: { 
    type: Number, 
    required: true 
  },
  
  // Bus status
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance", "on_route"],
    default: "inactive"
  },
  
  // Current location (updated in real-time)
  currentLocation: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    speed: { type: Number, default: 0 },  // km/h
    heading: { type: Number, default: 0 }  // degrees
  },
  
  // Location history for trip playback
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    speed: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Current trip information
  currentTrip: {
    startTime: Date,
    currentStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
    nextStop: { type: mongoose.Schema.Types.ObjectId, ref: "Stop" },
    estimatedArrival: Date,
    delayMinutes: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Indexes for fast queries
busSchema.index({ busNumber: 1 });
busSchema.index({ status: 1 });
busSchema.index({ route: 1 });
busSchema.index({ assignedDriver: 1 });

module.exports = mongoose.model("Bus", busSchema);