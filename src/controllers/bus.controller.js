

const Bus = require("../models/bus.model");
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

exports.getBuses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "departureTime";
    const order = req.query.order === "desc" ? -1 : 1;

    const buses = await Bus.find()
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    const total = await Bus.countDocuments();

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      buses
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.searchBuses = async (req, res) => {

  const { from, to } = req.query;

  const buses = await Bus.find();

  const filtered = buses.filter(bus => {

    const fromIndex = bus.routeStops.indexOf(from);
    const toIndex = bus.routeStops.indexOf(to);

    return (
      fromIndex !== -1 &&
      toIndex !== -1 &&
      fromIndex < toIndex
    );
  });

  res.json({ buses: filtered });
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

    const bus = await Bus.findById(req.driver.assignedBus);

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

    // 🔥 THIS IS THE IMPORTANT PART
    const io = req.app.get("io");

    io.emit("busLocationUpdate", {
      busId: bus._id.toString(),
      latitude,
      longitude
    });

    res.json({ message: "Location updated successfully" });

  } catch (error) {
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
};
exports.startSimulation = async (req, res) => {
  try {
    const busId = req.params.id;
    const io = req.app.get("io");  // ✅ get socket instance safely

    let currentLat = 29.1492;
    let currentLng = 75.7217;

    const endLat = 30.7333;
    const endLng = 76.7794;

    const steps = 20;
    let step = 0;

    const latStep = (endLat - currentLat) / steps;
    const lngStep = (endLng - currentLng) / steps;

    const interval = setInterval(async () => {

      if (step >= steps) {
        clearInterval(interval);
        console.log("Simulation finished");
        return;
      }

      currentLat += latStep;
      currentLng += lngStep;

      await Bus.findByIdAndUpdate(
        busId,
        {
          $set: {
            currentLocation: {
              latitude: currentLat,
              longitude: currentLng,
              updatedAt: Date.now()
            }
          },
          $push: {
            locationHistory: {
              latitude: currentLat,
              longitude: currentLng,
              timestamp: Date.now()
            }
          }
        }
      );

      console.log("Moved to:", currentLat, currentLng);

      // ✅ Emit real-time update
      io.emit("busLocationUpdate", {
        busId,
        latitude: currentLat,
        longitude: currentLng
      });

      step++;

    }, 3000);

    res.json({ message: "Simulation started" });

  } catch (error) {
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



exports.searchBuses = async (req, res) => {
  const { from, to } = req.query;

  const buses = await Bus.find({
    source: { $regex: from, $options: "i" },
    destination: { $regex: to, $options: "i" }
  });

  res.json(buses);
};

exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
