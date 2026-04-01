const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const searchLoggerMiddleware = require('./src/middleware/searchLogger.middleware');
const searchHistoryRoutes = require('./src/routes/searchHistory.routes');

// ==================== ENVIRONMENT VARIABLES ====================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/busTracker";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
app.set("io", io);

const Bus = require("./src/models/bus.model");

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("driverLocation", async (data) => {
    console.log("📍 Received driver location:", data);
    
    const { busId, latitude, longitude } = data;

    try {
      // Get previous location to calculate speed
      const previousBus = await Bus.findById(busId).select('currentLocation');
      let speed = 0;
      
      if (previousBus && previousBus.currentLocation && previousBus.currentLocation.latitude) {
        const prev = previousBus.currentLocation;
        const timeDiff = (Date.now() - new Date(prev.updatedAt).getTime()) / 1000 / 3600; // hours
        
        if (timeDiff > 0 && timeDiff < 1) { // Only calculate if last update was within 1 hour
          const dist = calculateDistance(
            prev.latitude, prev.longitude,
            latitude, longitude
          );
          speed = Math.round(dist / timeDiff * 10) / 10; // Round to 1 decimal
          console.log(`⚡ Speed calculated: ${speed} km/h`);
        }
      }

      // Update bus with new location and speed
      await Bus.findByIdAndUpdate(busId, {
        $set: {
          currentLocation: {
            latitude,
            longitude,
            speed,
            updatedAt: Date.now()
          }
        },
        $push: {
          locationHistory: {
            latitude,
            longitude,
            speed,
            timestamp: Date.now()
          }
        }
      });

      // Emit to all users with speed data
      io.emit("busLocationUpdate", {
        busId,
        latitude,
        longitude,
        speed,
        timestamp: Date.now()
      });

      console.log(`✅ Bus ${busId} location updated - Speed: ${speed} km/h`);

    } catch (error) {
      console.log("❌ Error updating location:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(searchLoggerMiddleware);
// ==================== RATE LIMITING ====================
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting to API routes
app.use("/api/", limiter);

// Routes
const busRoutes = require("./src/routes/bus.routes");
const routeRoutes = require("./src/routes/route.routes");
const adminRoutes = require("./src/routes/admin.routes");
const driverRoutes = require("./src/routes/driver.routes");
const stopRoutes = require("./src/routes/stop.routes");

app.use("/buses", busRoutes);
app.use("/routes", routeRoutes);
app.use("/admin", adminRoutes);
app.use("/drivers", driverRoutes);
app.use("/stops", stopRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("🚍 Haryana Bus Tracker Server Running");
});

// Error handler (MUST BE LAST)
const errorHandler = require("./src/middleware/error.middleware");
app.use(errorHandler);

// Database connection - USING MONGO_URI variable
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// Start server - USING PORT variable
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports.io = io;