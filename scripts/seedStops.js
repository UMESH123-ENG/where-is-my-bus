const mongoose = require("mongoose");
const Stop = require("../src/models/stop.model");
require("dotenv").config();

const haryanaStops = [
  // MAJOR CITIES - District Headquarters
  { name: "hisar", displayName: "Hisar", district: "Hisar", isMajorStop: true,
    coordinates: { latitude: 29.1492, longitude: 75.7217 } },
  { name: "rohtak", displayName: "Rohtak", district: "Rohtak", isMajorStop: true,
    coordinates: { latitude: 28.8955, longitude: 76.6066 } },
  { name: "jind", displayName: "Jind", district: "Jind", isMajorStop: true,
    coordinates: { latitude: 29.3250, longitude: 76.3120 } },
  { name: "panipat", displayName: "Panipat", district: "Panipat", isMajorStop: true,
    coordinates: { latitude: 29.3889, longitude: 76.9685 } },
  { name: "karnal", displayName: "Karnal", district: "Karnal", isMajorStop: true,
    coordinates: { latitude: 29.6857, longitude: 76.9905 } },
  { name: "ambala", displayName: "Ambala", district: "Ambala", isMajorStop: true,
    coordinates: { latitude: 30.3782, longitude: 76.7767 } },
  { name: "kurukshetra", displayName: "Kurukshetra", district: "Kurukshetra", isMajorStop: true,
    coordinates: { latitude: 29.9695, longitude: 76.8783 } },
  { name: "yamunanagar", displayName: "Yamunanagar", district: "Yamunanagar", isMajorStop: true,
    coordinates: { latitude: 30.1290, longitude: 77.2674 } },
  { name: "faridabad", displayName: "Faridabad", district: "Faridabad", isMajorStop: true,
    coordinates: { latitude: 28.4089, longitude: 77.3178 } },
  { name: "gurugram", displayName: "Gurugram", district: "Gurugram", isMajorStop: true,
    coordinates: { latitude: 28.4595, longitude: 77.0266 } },
  { name: "sonipat", displayName: "Sonipat", district: "Sonipat", isMajorStop: true,
    coordinates: { latitude: 28.9931, longitude: 77.0151 } },
  { name: "bhiwani", displayName: "Bhiwani", district: "Bhiwani", isMajorStop: true,
    coordinates: { latitude: 28.7992, longitude: 76.1331 } },
  { name: "sirsa", displayName: "Sirsa", district: "Sirsa", isMajorStop: true,
    coordinates: { latitude: 29.5349, longitude: 75.0289 } },
  { name: "fatehabad", displayName: "Fatehabad", district: "Fatehabad", isMajorStop: true,
    coordinates: { latitude: 29.5150, longitude: 75.4556 } },
  { name: "jhajjar", displayName: "Jhajjar", district: "Jhajjar", isMajorStop: true,
    coordinates: { latitude: 28.6063, longitude: 76.6565 } },
  { name: "rewari", displayName: "Rewari", district: "Rewari", isMajorStop: true,
    coordinates: { latitude: 28.1990, longitude: 76.6180 } },
  { name: "mahendragarh", displayName: "Mahendragarh", district: "Mahendragarh", isMajorStop: true,
    coordinates: { latitude: 28.2700, longitude: 76.1500 } },
  { name: "palwal", displayName: "Palwal", district: "Palwal", isMajorStop: true,
    coordinates: { latitude: 28.1440, longitude: 77.3260 } },
  { name: "nuh", displayName: "Nuh", district: "Nuh", isMajorStop: true,
    coordinates: { latitude: 28.1036, longitude: 77.0016 } },
  { name: "charkhi dadri", displayName: "Charkhi Dadri", district: "Charkhi Dadri", isMajorStop: true,
    coordinates: { latitude: 28.5915, longitude: 76.2685 } },
  
  // MAJOR TOWNS
  { name: "hansi", displayName: "Hansi", district: "Hisar", isMajorStop: false,
    coordinates: { latitude: 29.1000, longitude: 75.9667 } },
  { name: "bahadurgarh", displayName: "Bahadurgarh", district: "Jhajjar", isMajorStop: false,
    coordinates: { latitude: 28.6833, longitude: 76.9167 } },
  { name: "jagadhri", displayName: "Jagadhri", district: "Yamunanagar", isMajorStop: false,
    coordinates: { latitude: 30.1670, longitude: 77.3000 } },
  { name: "thanesar", displayName: "Thanesar", district: "Kurukshetra", isMajorStop: false,
    coordinates: { latitude: 29.9833, longitude: 76.8167 } },
  { name: "kaithal", displayName: "Kaithal", district: "Kaithal", isMajorStop: true,
    coordinates: { latitude: 29.8017, longitude: 76.3997 } },
  { name: "narwana", displayName: "Narwana", district: "Jind", isMajorStop: false,
    coordinates: { latitude: 29.6000, longitude: 76.1167 } },
  { name: "tohana", displayName: "Tohana", district: "Fatehabad", isMajorStop: false,
    coordinates: { latitude: 29.7000, longitude: 75.9167 } },
  { name: "ratia", displayName: "Ratia", district: "Fatehabad", isMajorStop: false,
    coordinates: { latitude: 29.6833, longitude: 75.5833 } },
  { name: "mandi dabwali", displayName: "Mandi Dabwali", district: "Sirsa", isMajorStop: false,
    coordinates: { latitude: 29.9500, longitude: 74.7333 } },
  { name: "ellenabad", displayName: "Ellenabad", district: "Sirsa", isMajorStop: false,
    coordinates: { latitude: 29.4500, longitude: 74.6667 } },
  
  // OUTSIDE HARYANA - Major Destinations
  { name: "delhi", displayName: "Delhi", district: "Delhi", state: "Delhi", isMajorStop: true,
    coordinates: { latitude: 28.7041, longitude: 77.1025 } },
  { name: "chandigarh", displayName: "Chandigarh", district: "Chandigarh", state: "Chandigarh", isMajorStop: true,
    coordinates: { latitude: 30.7333, longitude: 76.7794 } },
  { name: "shimla", displayName: "Shimla", district: "Shimla", state: "Himachal Pradesh", isMajorStop: true,
    coordinates: { latitude: 31.1048, longitude: 77.1734 } },
  { name: "manali", displayName: "Manali", district: "Kullu", state: "Himachal Pradesh", isMajorStop: false,
    coordinates: { latitude: 32.2396, longitude: 77.1887 } },
  { name: "jaipur", displayName: "Jaipur", district: "Jaipur", state: "Rajasthan", isMajorStop: true,
    coordinates: { latitude: 26.9124, longitude: 75.7873 } },
  { name: "udaipur", displayName: "Udaipur", district: "Udaipur", state: "Rajasthan", isMajorStop: false,
    coordinates: { latitude: 24.5854, longitude: 73.7125 } },
  { name: "lucknow", displayName: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", isMajorStop: true,
    coordinates: { latitude: 26.8467, longitude: 80.9462 } },
  { name: "agra", displayName: "Agra", district: "Agra", state: "Uttar Pradesh", isMajorStop: true,
    coordinates: { latitude: 27.1767, longitude: 78.0081 } },
  { name: "dehradun", displayName: "Dehradun", district: "Dehradun", state: "Uttarakhand", isMajorStop: true,
    coordinates: { latitude: 30.3165, longitude: 78.0322 } },
  { name: "haridwar", displayName: "Haridwar", district: "Haridwar", state: "Uttarakhand", isMajorStop: true,
    coordinates: { latitude: 29.9457, longitude: 78.1642 } }
];

async function seedStops() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Clear existing stops
    await Stop.deleteMany({});
    console.log("🗑️ Cleared existing stops");
    
    // Add search tags to each stop
    const stopsWithTags = haryanaStops.map(stop => ({
      ...stop,
      searchTags: [
        stop.name,
        stop.displayName.toLowerCase(),
        stop.district.toLowerCase(),
        ...stop.displayName.split(' ').map(word => word.toLowerCase())
      ]
    }));
    
    // Insert all stops
    const result = await Stop.insertMany(stopsWithTags);
    console.log(`✅ Added ${result.length} stops to database`);
    
    // Show summary by district
    const districts = [...new Set(result.map(s => s.district))];
    console.log("\n📊 Stops added by district:");
    districts.forEach(district => {
      const count = result.filter(s => s.district === district).length;
      console.log(`   ${district}: ${count} stops`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding stops:", error);
    process.exit(1);
  }
}

seedStops();