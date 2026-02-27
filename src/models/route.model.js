const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true
  },
  stops: [
    {
      stopName: String,
      arrivalTime: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Route", routeSchema);
