const express = require("express");


const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
app.set("io", io);

const Bus = require("./src/models/bus.model");

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("driverLocation", async (data) => {
    console.log("Received driver location:", data);
    io.emit("busLocationUpdate", data); // Broadcast to all clients

    const { busId, latitude, longitude } = data;

    try {
      await Bus.findByIdAndUpdate(busId, {
        $set: {
          currentLocation: {
            latitude,
            longitude,
            updatedAt: Date.now()
          }
        },
        $push: {
          locationHistory: {
            latitude,
            longitude,
            timestamp: Date.now()
          }
        }
      });

      // Emit to all users
      io.emit("busLocationUpdate", {
        busId,
        latitude,
        longitude
      });

    } catch (error) {
      console.log("Error updating location:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});



// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const busRoutes = require("./src/routes/bus.routes");
const routeRoutes = require("./src/routes/route.route");
const adminRoutes = require("./src/routes/admin.routes");

app.use("/buses", busRoutes);
app.use("/routes", routeRoutes);
app.use("/admin", adminRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("🚍 Haryana Bus Tracker Server Running");
});

// Error handler (MUST BE LAST)
const errorHandler = require("./src/middleware/error.middleware");
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

const driverRoutes = require("./src/routes/driver.routes");
app.use("/drivers", driverRoutes);

module.exports.io = io;
