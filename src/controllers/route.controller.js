const Route = require("../models/route.model");
const Stop = require("../models/stop.model");

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate arrival times
function generateArrivalTimes(baseTime, distances, avgSpeed = 50) {
  const times = [];
  let [hours, minutes] = baseTime.split(':').map(Number);
  
  times.push(baseTime); // First stop
  
  for (let i = 1; i < distances.length; i++) {
    const travelTimeMinutes = Math.round((distances[i] / avgSpeed) * 60);
    let totalMinutes = hours * 60 + minutes + travelTimeMinutes;
    
    let newHours = Math.floor(totalMinutes / 60) % 24;
    let newMinutes = totalMinutes % 60;
    
    times.push(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
  }
  
  return times;
}

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate("stops.stop");
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate("stops.stop");
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new route
exports.addRoute = async (req, res) => {
  try {
    const { routeNumber, routeName, fromCity, toCity, stopNames, baseDeparture } = req.body;

    // Get stop objects from database
    const stops = await Stop.find({ 
      name: { $in: stopNames.map(n => n.toLowerCase()) } 
    });

    if (stops.length !== stopNames.length) {
      const found = stops.map(s => s.name);
      const missing = stopNames.filter(n => !found.includes(n.toLowerCase()));
      return res.status(400).json({ 
        message: "Some stops not found in database", 
        missingStops: missing 
      });
    }

    // Sort stops in correct order
    const orderedStops = stopNames.map(name => 
      stops.find(s => s.name === name.toLowerCase())
    );

    // Calculate distances between stops
    const distances = [0];
    for (let i = 1; i < orderedStops.length; i++) {
      const prev = orderedStops[i-1].coordinates;
      const curr = orderedStops[i].coordinates;
      const dist = calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      distances.push(distances[i-1] + dist);
    }

    const totalDistance = distances[distances.length - 1];

    // Generate arrival times
    const arrivalTimes = generateArrivalTimes(baseDeparture || "06:00", distances);

    // Create route stops array
    const routeStops = orderedStops.map((stop, index) => ({
      stop: stop._id,
      stopOrder: index,
      stopName: stop.name,
      stopDisplayName: stop.displayName,
      distanceFromStart: distances[index],
      estimatedArrivalTime: arrivalTimes[index],
      estimatedDepartureTime: index < orderedStops.length - 1 ? 
        addMinutes(arrivalTimes[index], 5) : arrivalTimes[index],
      haltDuration: index < orderedStops.length - 1 ? 5 : 0
    }));

    // Create route
    const route = new Route({
      routeNumber,
      routeName,
      fromCity: fromCity.toLowerCase(),
      fromCityDisplay: orderedStops[0].displayName,
      toCity: toCity.toLowerCase(),
      toCityDisplay: orderedStops[orderedStops.length - 1].displayName,
      stops: routeStops,
      totalDistance,
      estimatedDuration: Math.round((totalDistance / 50) * 60)
    });

    const savedRoute = await route.save();
    res.status(201).json(savedRoute);

  } catch (error) {
    console.error("Error adding route:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update route
exports.updateRoute = async (req, res) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search routes between cities
exports.searchRoutes = async (req, res) => {
  try {
    const { from, to } = req.params;
    
    const routes = await Route.find({
      "stops.stopName": { $all: [from.toLowerCase(), to.toLowerCase()] }
    }).populate("stops.stop");

    const validRoutes = routes.filter(route => {
      const fromStop = route.stops.find(s => s.stopName === from.toLowerCase());
      const toStop = route.stops.find(s => s.stopName === to.toLowerCase());
      return fromStop && toStop && fromStop.stopOrder < toStop.stopOrder;
    });

    res.json(validRoutes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new stop (if you need to add stops dynamically)
exports.addStop = async (req, res) => {
  try {
    const stop = new Stop(req.body);
    const savedStop = await stop.save();
    res.status(201).json(savedStop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function
function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  let totalMins = hours * 60 + mins + minutes;
  let newHours = Math.floor(totalMins / 60) % 24;
  let newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}