
const Bus = require("../models/bus.model");
const Route = require("../models/route.model");  // 🔥 ADD THIS LINE!
const Stop = require("../models/stop.model");    
const { calculateDistance } = require("../utils/distance");

exports.addBus = async (req, res) => {
  try {
    const bus = new Bus(req.body);
    const savedBus = await bus.save();
    res.status(201).json(savedBus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Replace your existing getBuses with this
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate({
        path: "route",
        populate: {
          path: "stops.stop",
          model: "Stop"
        }
      });
    
    res.json({
      success: true,
      buses: buses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Also update getBusById
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate({
        path: "route",
        populate: {
          path: "stops.stop",
          model: "Stop"
        }
      });
      
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchBuses = async (req, res) => {
  try {
    const { source, destination } = req.query;

    if (!source || !destination) {
      return res.status(400).json({
        message: "Source and destination required"
      });
    }

    // Find all buses
    const buses = await Bus.find().populate({
      path: "route",
      populate: { path: "stops.stop" }
    });

    console.log("Total buses found:", buses.length);

    const matchingBuses = buses.filter(bus => {
      if (!bus.route || !bus.route.stops || bus.route.stops.length === 0) {
        return false;
      }

      const stops = bus.route.stops.map(s => s.stopName.toLowerCase());
      
      const sourceIndex = stops.indexOf(source.toLowerCase());
      const destinationIndex = stops.indexOf(destination.toLowerCase());

      return sourceIndex !== -1 && 
             destinationIndex !== -1 && 
             sourceIndex < destinationIndex;
    });

    console.log("Matching buses:", matchingBuses.length);
    res.json(matchingBuses);

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      message: "Error searching buses",
      error: error.message
    });
  }
};
exports.updateBus = async (req, res) => {
  try {
    const updatedBus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(updatedBus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.deleteBus = async (req, res) => {
  try {
    const deletedBus = await Bus.findByIdAndDelete(req.params.id);

    if (!deletedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json({ message: "Bus deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    // 🔥 busId comes from token, not from URL or body!
    const busId = req.driver.busId;

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    bus.currentLocation = {
      latitude,
      longitude,
      updatedAt: Date.now()
    };

    bus.locationHistory.push({
      latitude,
      longitude,
      timestamp: Date.now()
    });

    await bus.save();

    const io = req.app.get("io");
    io.emit("busLocationUpdate", {
      busId: bus._id.toString(),
      latitude,
      longitude
    });

    res.json({ message: "Location updated successfully" });

  } catch (error) {
    console.log("Error in updateLocation:", error);
    res.status(400).json({ message: error.message });
  }
};


exports.getLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus.currentLocation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getLocationHistory = async (req, res) => {
  try {
    console.log("History route hit");

    const bus = await Bus.findById(req.params.id);

    console.log("Bus found:", bus);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

 res.json(bus.locationHistory || []);


  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: error.message });
  }
};exports.startSimulation = async (req, res) => {
  try {
    const busId = req.params.id;
    const io = req.app.get("io");

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    console.log("🚍 Simulating bus:", bus.busNumber);
    console.log("📍 Route:", bus.stops.join(" → "));

    // City coordinates database
    const cityCoordinates = {
      "hisar": [29.1492, 75.7217],
      "jind": [29.3250, 76.3120],
      "rohtak": [28.8955, 76.6066],
      "delhi": [28.7041, 77.1025],
      "chandigarh": [30.7333, 76.7794],
      "panipat": [29.3889, 76.9685],
      "karnal": [29.6857, 76.9905],
      "hansi": [29.1000, 75.9667],
      "bahadurgarh": [28.6833, 76.9167]
    };

    // Build the full route coordinates from stops
    const stops = [];
    for (let stop of bus.stops) {
      const stopLower = stop.toLowerCase();
      if (cityCoordinates[stopLower]) {
        stops.push({
          name: stop,
          coords: cityCoordinates[stopLower]
        });
      }
    }

    if (stops.length < 2) {
      return res.status(400).json({ 
        message: "Not enough stops have coordinates mapped" 
      });
    }

    console.log("🛣️ Fetching highway routes between stops...");

    // Fetch REAL highway routes between each consecutive stop
    let fullHighwayRoute = [];
    
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      
      console.log(`   ${from.name} → ${to.name}`);
      
      try {
        // OSRM API call for real highway route
        const osrmURL = `https://router.project-osrm.org/route/v1/driving/${from.coords[1]},${from.coords[0]};${to.coords[1]},${to.coords[0]}?overview=full&geometries=geojson`;
        
        const response = await fetch(osrmURL);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          // Convert OSRM coordinates [lng, lat] to Leaflet [lat, lng]
          const routeCoords = data.routes[0].geometry.coordinates
            .map(coord => [coord[1], coord[0]]);
          
          // Add to full route (avoid duplicate points at junctions)
          if (fullHighwayRoute.length > 0) {
            fullHighwayRoute = fullHighwayRoute.concat(routeCoords.slice(1));
          } else {
            fullHighwayRoute = fullHighwayRoute.concat(routeCoords);
          }
          
          console.log(`   ✅ Got ${routeCoords.length} highway points`);
        } else {
          console.log(`   ⚠️ No route found, using straight line`);
          // Fallback to straight line
          fullHighwayRoute.push(from.coords);
          fullHighwayRoute.push(to.coords);
        }
      } catch (err) {
        console.log(`   ❌ Error fetching route:`, err.message);
        // Fallback to straight line
        fullHighwayRoute.push(from.coords);
        fullHighwayRoute.push(to.coords);
      }
    }

    console.log(`🛣️ Total highway points: ${fullHighwayRoute.length}`);

    // Simulation variables
    let currentPointIndex = 0;
    const totalPoints = fullHighwayRoute.length;

    // Clear any existing simulation
    if (global.simulationIntervals && global.simulationIntervals[busId]) {
      clearInterval(global.simulationIntervals[busId]);
    }

    if (!global.simulationIntervals) global.simulationIntervals = {};

    const interval = setInterval(async () => {
      try {
        if (currentPointIndex >= totalPoints) {
          clearInterval(interval);
          delete global.simulationIntervals[busId];
          console.log(`🎯 Simulation complete - reached ${bus.destination}`);
          return;
        }

        const currentPos = fullHighwayRoute[currentPointIndex];
        
        // Update database
        await Bus.findByIdAndUpdate(busId, {
          $set: {
            currentLocation: {
              latitude: currentPos[0],
              longitude: currentPos[1],
              updatedAt: Date.now()
            }
          },
          $push: {
            locationHistory: {
              latitude: currentPos[0],
              longitude: currentPos[1],
              timestamp: Date.now()
            }
          }
        });

        // Emit update
        io.emit("busLocationUpdate", {
          busId,
          latitude: currentPos[0],
          longitude: currentPos[1]
        });

        // Log progress every 10 points
        if (currentPointIndex % 10 === 0) {
          const progress = ((currentPointIndex / totalPoints) * 100).toFixed(1);
          console.log(`📍 Progress: ${progress}% - at ${currentPos[0].toFixed(4)}, ${currentPos[1].toFixed(4)}`);
        }

        currentPointIndex++;

      } catch (error) {
        console.log("❌ Simulation error:", error);
        clearInterval(interval);
      }
    }, 1500); // Update every 1.5 seconds

    global.simulationIntervals[busId] = interval;
    
    res.json({ 
      message: "🚀 Highway simulation started", 
      route: bus.stops,
      highwayPoints: totalPoints,
      estimatedDuration: Math.round(totalPoints * 1.5 / 60) + " minutes"
    });

  } catch (error) {
    console.error("❌ Simulation error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.getTotalDistance = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const history = bus.locationHistory;

    if (!history || history.length < 2) {
      return res.json({ totalDistance: 0 });
    }

    let totalDistance = 0;

    for (let i = 1; i < history.length; i++) {
      totalDistance += calculateDistance(
        history[i - 1].latitude,
        history[i - 1].longitude,
        history[i].latitude,
        history[i].longitude
      );
    }

    res.json({
      totalDistance: totalDistance.toFixed(2) + " km"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stopSimulation = async (req, res) => {
  try {
    const busId = req.params.id;
    
    if (global.simulationIntervals && global.simulationIntervals[busId]) {
      clearInterval(global.simulationIntervals[busId]);
      delete global.simulationIntervals[busId];
      console.log(`🛑 Simulation stopped for bus ${busId}`);
    }
    
    res.json({ message: "Simulation stopped" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Calculate ETA based on current location and schedule
exports.getETA = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    
    if (!bus.currentLocation || bus.currentLocation.latitude === 0) {
      return res.json({ eta: "Not started", nextStop: bus.stops[0] });
    }
    
    // Find next stop
    let nextStop = null;
    let nextStopIndex = -1;
    
    // Get coordinates for stops (you'll need a geocoding service or pre-defined)
    const stopCoordinates = {
      "hisar": [29.1492, 75.7217],
      "jind": [29.3250, 76.3120],
      "rohtak": [28.8955, 76.6066],
      "delhi": [28.7041, 77.1025]
    };
    
    // Find which stop is next based on current location
    for (let i = 0; i < bus.stops.length - 1; i++) {
      const currentStop = bus.stops[i].toLowerCase();
      const nextStopName = bus.stops[i + 1].toLowerCase();
      
      if (stopCoordinates[currentStop] && stopCoordinates[nextStopName]) {
        const distToCurrent = calculateDistance(
          bus.currentLocation.latitude,
          bus.currentLocation.longitude,
          stopCoordinates[currentStop][0],
          stopCoordinates[currentStop][1]
        );
        
        // If within 5km of current stop, next stop is upcoming
        if (distToCurrent < 5) {
          nextStop = bus.stops[i + 1];
          nextStopIndex = i + 1;
          break;
        }
      }
    }
    
    // If no next stop found, use first stop after current approximate position
    if (!nextStop) {
      // Simple logic: assume we're between stops based on route progress
      const totalStops = bus.stops.length;
      const progress = Math.floor(Math.random() * (totalStops - 1)) + 1; // This should be calculated properly
      nextStop = bus.stops[progress];
      nextStopIndex = progress;
    }
    
    // Calculate distance to next stop
    const nextStopCoords = stopCoordinates[nextStop.toLowerCase()];
    if (!nextStopCoords) {
      return res.json({ eta: "Unknown", nextStop });
    }
    
    const distanceToNext = calculateDistance(
      bus.currentLocation.latitude,
      bus.currentLocation.longitude,
      nextStopCoords[0],
      nextStopCoords[1]
    );
    
    // ETA calculation (assume average speed 40 km/h in cities, 60 km/h on highways)
    const avgSpeed = distanceToNext > 20 ? 60 : 40;
    const etaMinutes = Math.round((distanceToNext / avgSpeed) * 60);
    z
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Add to bus.controller.js
exports.calculateHighwayRoute = async (req, res) => {
  try {
    const busId = req.params.id;
    const bus = await Bus.findById(busId);
    
    if (!bus || !bus.stops || bus.stops.length < 2) {
      return res.status(400).json({ message: "Invalid bus or stops" });
    }

    // City coordinates
    const cityCoordinates = {
      "hisar": [29.1492, 75.7217],
      "jind": [29.3250, 76.3120],
      "rohtak": [28.8955, 76.6066],
      "delhi": [28.7041, 77.1025],
      "chandigarh": [30.7333, 76.7794]
    };

    let fullRoute = [];
    let totalDistance = 0;

    // Get route between each consecutive stop
    for (let i = 0; i < bus.stops.length - 1; i++) {
      const from = bus.stops[i].toLowerCase();
      const to = bus.stops[i + 1].toLowerCase();
      
      const fromCoords = cityCoordinates[from];
      const toCoords = cityCoordinates[to];
      
      if (!fromCoords || !toCoords) continue;

      // Call OSRM API
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const routeCoords = data.routes[0].geometry.coordinates
          .map(coord => [coord[1], coord[0]]);
        
        if (fullRoute.length > 0) {
          fullRoute = fullRoute.concat(routeCoords.slice(1));
        } else {
          fullRoute = fullRoute.concat(routeCoords);
        }
        
        totalDistance += data.routes[0].distance / 1000; // Convert to km
      }
    }

    // Save to database
    bus.highwayRoute = fullRoute;
    bus.routeDistance = Math.round(totalDistance);
    bus.estimatedDuration = Math.round(totalDistance / 50 * 60); // 50 km/h average
    await bus.save();

    res.json({
      message: "Highway route calculated",
      points: fullRoute.length,
      distance: totalDistance + " km",
      duration: bus.estimatedDuration + " minutes"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateBusStatus = async (req, res) => {
  try {
    // Get bus ID from driver's token (not from URL)
    const busId = req.driver.busId;
    
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      { status: "active" },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(updatedBus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Driver can update status of their own bus
exports.updateBusStatus = async (req, res) => {
  try {
    // Get bus ID from driver's token (set by driverAuth middleware)
    const busId = req.driver.busId;
    
    if (!busId) {
      return res.status(400).json({ message: "Bus ID not found in token" });
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      { status: "active" },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    console.log(`✅ Bus ${updatedBus.busNumber} status updated to: ${updatedBus.status}`);
    res.json({ 
      message: "Bus status updated", 
      status: updatedBus.status,
      bus: updatedBus.busNumber 
    });
  } catch (error) {
    console.error("❌ Error updating bus status:", error);
    res.status(500).json({ message: error.message });
  }
};