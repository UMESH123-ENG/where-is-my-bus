// ============================================
// SEARCH HISTORY LOGGER - File Streaming
// This runs alongside MongoDB without changing it
// ============================================

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}

// Log file path
const SEARCH_LOG_FILE = path.join(LOGS_DIR, 'search-history.log');

/**
 * Log search query to file using STREAMING
 * @param {Object} searchData - The search data to log
 */
const logSearch = (searchData) => {
    return new Promise((resolve, reject) => {
        try {
            // Create search log entry
            const logEntry = {
                timestamp: new Date().toISOString(),
                ip: searchData.ip || 'unknown',
                userId: searchData.userId || 'anonymous',
                from: searchData.from,
                to: searchData.to,
                resultsCount: searchData.resultsCount || 0,
                userAgent: searchData.userAgent || 'unknown'
            };

            // ✅ FILE STREAMING: Append to log file
            const writeStream = fs.createWriteStream(SEARCH_LOG_FILE, { flags: 'a' });
            
            writeStream.write(JSON.stringify(logEntry) + '\n');
            writeStream.end();

            writeStream.on('finish', () => {
                console.log('✅ Search logged to file');
                resolve();
            });

            writeStream.on('error', (error) => {
                console.error('❌ Error writing search log:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Error in logSearch:', error);
            reject(error);
        }
    });
};

/**
 * Read search history with STREAMING (memory efficient)
 * @param {Object} options - Filter options
 * @param {Function} callback - Callback with results
 */
const getSearchHistory = (options = {}, callback) => {
    const { limit = 100, fromDate, toDate, fromCity, toCity } = options;
    
    if (!fs.existsSync(SEARCH_LOG_FILE)) {
        return callback([]);
    }

    const searches = [];
    let buffer = '';
    let lineCount = 0;

    // ✅ FILE STREAMING: Read in chunks
    const readStream = fs.createReadStream(SEARCH_LOG_FILE, { encoding: 'utf8' });

    readStream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line

        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const search = JSON.parse(line);
                    
                    // Apply filters
                    let include = true;
                    
                    if (fromDate && new Date(search.timestamp) < new Date(fromDate)) {
                        include = false;
                    }
                    if (toDate && new Date(search.timestamp) > new Date(toDate)) {
                        include = false;
                    }
                    if (fromCity && search.from !== fromCity) {
                        include = false;
                    }
                    if (toCity && search.to !== toCity) {
                        include = false;
                    }
                    
                    if (include) {
                        searches.push(search);
                    }
                    lineCount++;
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        });
    });

    readStream.on('end', () => {
        // Sort by timestamp (newest first)
        searches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        callback({
            totalLines: lineCount,
            filteredCount: searches.length,
            searches: searches.slice(0, limit)
        });
    });

    readStream.on('error', (err) => {
        console.error('Stream error:', err);
        callback({ error: err.message });
    });
};

/**
 * Get search statistics (streaming)
 */
const getSearchStats = (callback) => {
    if (!fs.existsSync(SEARCH_LOG_FILE)) {
        return callback({
            totalSearches: 0,
            uniqueUsers: 0,
            popularRoutes: []
        });
    }

    const stats = {
        totalSearches: 0,
        uniqueIPs: new Set(),
        uniqueUsers: new Set(),
        routeCounts: {},
        hourlyDistribution: Array(24).fill(0)
    };

    const readStream = fs.createReadStream(SEARCH_LOG_FILE, { encoding: 'utf8' });
    let buffer = '';

    readStream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const search = JSON.parse(line);
                    stats.totalSearches++;
                    
                    if (search.ip) stats.uniqueIPs.add(search.ip);
                    if (search.userId) stats.uniqueUsers.add(search.userId);
                    
                    const route = `${search.from}→${search.to}`;
                    stats.routeCounts[route] = (stats.routeCounts[route] || 0) + 1;
                    
                    const hour = new Date(search.timestamp).getHours();
                    stats.hourlyDistribution[hour]++;
                    
                } catch (e) {}
            }
        });
    });

    readStream.on('end', () => {
        // Get top 10 routes
        const popularRoutes = Object.entries(stats.routeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([route, count]) => ({ route, count }));

        callback({
            totalSearches: stats.totalSearches,
            uniqueIPs: stats.uniqueIPs.size,
            uniqueUsers: stats.uniqueUsers.size,
            popularRoutes,
            hourlyDistribution: stats.hourlyDistribution
        });
    });
};

module.exports = {
    logSearch,
    getSearchHistory,
    getSearchStats
};