const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
  // Unique identifier (lowercase for searching)
  name: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Display name (with proper capitalization)
  displayName: { 
    type: String, 
    required: true 
  },
  
  // GPS Coordinates
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  
  // Location details
  district: { 
    type: String,
    required: true 
  },
  
  state: { 
    type: String, 
    default: "Haryana" 
  },
  
  // For search suggestions
  searchTags: [{
    type: String,
    lowercase: true
  }],
  
  // Whether this is a major stop
  isMajorStop: {
    type: Boolean,
    default: false
  },
  
  // Popularity score (higher = more buses)
  popularity: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Create indexes for fast searching
stopSchema.index({ name: 1 });
stopSchema.index({ searchTags: 1 });
stopSchema.index({ district: 1 });
stopSchema.index({ isMajorStop: 1 });

module.exports = mongoose.model("Stop", stopSchema);