const mongoose = require("mongoose");
const Stop = require("../src/models/stop.model");
const Route = require("../src/models/route.model");
require("dotenv").config();

// Function to calculate distance between two coordinates (Haversine formula)
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

// Generate arrival times based on distance and average speed
function generateArrivalTimes(baseTime, distances, avgSpeed = 50) {
  const times = [];
  let currentHour = parseInt(baseTime.split(':')[0]);
  let currentMinute = parseInt(baseTime.split(':')[1]);
  
  times.push(baseTime); // First stop departure
  
  for (let i = 1; i < distances.length; i++) {
    const travelTimeMinutes = Math.round((distances[i] / avgSpeed) * 60);
    currentMinute += travelTimeMinutes;
    
    while (currentMinute >= 60) {
      currentHour++;
      currentMinute -= 60;
    }
    
    const hourStr = currentHour.toString().padStart(2, '0');
    const minuteStr = currentMinute.toString().padStart(2, '0');
    times.push(`${hourStr}:${minuteStr}`);
  }
  
  return times;
}

const routes = [
  {
    routeNumber: "HR-001",
    routeName: "Hisar-Delhi Express",
    fromCity: "hisar",
    toCity: "delhi",
    baseDeparture: "06:00",
    stopNames: ["hisar", "hansi", "jind", "rohtak", "bahadurgarh", "delhi"]
  },
  {
    routeNumber: "HR-002",
    routeName: "Chandigarh-Delhi",
    fromCity: "chandigarh",
    toCity: "delhi",
    baseDeparture: "07:00",
    stopNames: ["chandigarh", "ambala", "kurukshetra", "karnal", "panipat", "sonipat", "delhi"]
  },
  {
    routeNumber: "HR-003",
    routeName: "Jind-Rohtak Local",
    fromCity: "jind",
    toCity: "rohtak",
    baseDeparture: "08:00",
    stopNames: ["jind", "rohtak"]
  },
  {
    routeNumber: "HR-004",
    routeName: "Sirsa-Delhi",
    fromCity: "sirsa",
    toCity: "delhi",
    baseDeparture: "05:30",
    stopNames: ["sirsa", "fatehabad", "hisar", "rohtak", "bahadurgarh", "delhi"]
  },
  {
    routeNumber: "HR-005",
    routeName: "Ambala-Jaipur",
    fromCity: "ambala",
    toCity: "jaipur",
    baseDeparture: "06:30",
    stopNames: ["ambala", "kurukshetra", "karnal", "panipat", "rohtak", "jaipur"]
  },
  {
    routeNumber: "HR-006",
    routeName: "Faridabad-Chandigarh",
    fromCity: "faridabad",
    toCity: "chandigarh",
    baseDeparture: "07:30",
    stopNames: ["faridabad", "gurugram", "delhi", "sonipat", "panipat", "karnal", "ambala", "chandigarh"]
  },
  {
    routeNumber: "HR-007",
    routeName: "Bhiwani-Dehradun",
    fromCity: "bhiwani",
    toCity: "dehradun",
    baseDeparture: "06:00",
    stopNames: ["bhiwani", "rohtak", "panipat", "karnal", "ambala", "dehradun"]
  }
];

async function createRoutes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Clear existing routes
    await Route.deleteMany({});
    console.log("🗑️ Cleared existing routes");
    
    for (const routeData of routes) {
      console.log(`\n🛣️ Creating route: ${routeData.routeName}`);
      
      // Get stop objects from database
      const stops = await Stop.find({ 
        name: { $in: routeData.stopNames } 
      });
      
      if (stops.length !== routeData.stopNames.length) {
        const found = stops.map(s => s.name);
        const missing = routeData.stopNames.filter(n => !found.includes(n));
        console.log(`❌ Missing stops: ${missing.join(', ')}`);
        continue;
      }
      
      // Sort stops in correct order
      const orderedStops = routeData.stopNames.map(name => 
        stops.find(s => s.name === name)
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
      const arrivalTimes = generateArrivalTimes(routeData.baseDeparture, distances);
      
      // Generate path coordinates (simplified - would use OSRM in production)
      const pathCoordinates = [];
      orderedStops.forEach((stop, index) => {
        pathCoordinates.push({
          latitude: stop.coordinates.latitude,
          longitude: stop.coordinates.longitude,
          order: index
        });
        
        // Add intermediate points between stops (simplified)
        if (index < orderedStops.length - 1) {
          const next = orderedStops[index + 1].coordinates;
          for (let i = 1; i <= 5; i++) {
            const ratio = i / 6;
            pathCoordinates.push({
              latitude: stop.coordinates.latitude + (next.latitude - stop.coordinates.latitude) * ratio,
              longitude: stop.coordinates.longitude + (next.longitude - stop.coordinates.longitude) * ratio,
              order: index + (i / 6)
            });
          }
        }
      });
      
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
      
      // Create route document
      const route = new Route({
        routeNumber: routeData.routeNumber,
        routeName: routeData.routeName,
        fromCity: routeData.fromCity,
        fromCityDisplay: orderedStops[0].displayName,
        toCity: routeData.toCity,
        toCityDisplay: orderedStops[orderedStops.length - 1].displayName,
        pathCoordinates: pathCoordinates.sort((a, b) => a.order - b.order),
        stops: routeStops,
        totalDistance: totalDistance,
        estimatedDuration: Math.round((totalDistance / 50) * 60) // 50 km/h average
      });
      
      await route.save();
      console.log(`✅ Created route: ${routeData.routeName} (${totalDistance.toFixed(0)} km)`);
      console.log(`   Stops: ${orderedStops.length}`);
      console.log(`   Duration: ${route.estimatedDuration} minutes`);
    }
    
    // Show summary
    const totalRoutes = await Route.countDocuments();
    const totalStops = await Stop.countDocuments();
    console.log("\n📊 SUMMARY:");
    console.log(`   Total Routes: ${totalRoutes}`);
    console.log(`   Total Stops: ${totalStops}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating routes:", error);
    process.exit(1);
  }
}

function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  let totalMins = hours * 60 + mins + minutes;
  let newHours = Math.floor(totalMins / 60) % 24;
  let newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

createRoutes();