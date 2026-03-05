const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  // Unique route identifier
  routeNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Display name
  routeName: { 
    type: String, 
    required: true 
  },
  
  // Start and end cities
  fromCity: { 
    type: String, 
    required: true 
  },
  
  fromCityDisplay: { 
    type: String, 
    required: true 
  },
  
  toCity: { 
    type: String, 
    required: true 
  },
  
  toCityDisplay: { 
    type: String, 
    required: true 
  },
  
  // Complete path coordinates for map drawing
  pathCoordinates: [{
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    order: { type: Number, required: true }
  }],
  
  // Stops in order with details
  stops: [{
    stop: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Stop",
      required: true 
    },
    stopOrder: { 
      type: Number, 
      required: true 
    },
    stopName: { 
      type: String, 
      required: true 
    },
    stopDisplayName: { 
      type: String, 
      required: true 
    },
    distanceFromStart: { 
      type: Number,  // in kilometers
      default: 0 
    },
    estimatedArrivalTime: { 
      type: String,  // e.g., "10:30 AM"
      required: true 
    },
    estimatedDepartureTime: { 
      type: String,  // e.g., "10:35 AM"
      required: true 
    },
    haltDuration: { 
      type: Number,  // in minutes
      default: 5 
    }
  }],
  
  // Route statistics
  totalDistance: { 
    type: Number,  // in kilometers
    required: true 
  },
  
  estimatedDuration: { 
    type: Number,  // in minutes
    required: true 
  },
  
  // Buses currently on this route
  activeBuses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus"
  }],
  
  // Popularity for search ranking
  popularity: {
    type: Number,
    default: 0
  },
  
  // Route status
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Indexes for fast searching
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ fromCity: 1, toCity: 1 });
routeSchema.index({ "stops.stopName": 1 });

module.exports = mongoose.model("Route", routeSchema);