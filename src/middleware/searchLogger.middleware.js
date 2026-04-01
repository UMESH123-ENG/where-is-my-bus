// ============================================
// SEARCH LOGGER MIDDLEWARE
// Automatically logs all searches without changing controllers
// ============================================

const searchLogger = require('../utils/searchLogger');

module.exports = async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to capture response
    res.json = function(data) {
        // Log the search if this is a search request
        if (req.path === '/search' || req.path.includes('/buses/search')) {
            const searchData = {
                ip: req.ip || req.connection.remoteAddress,
                userId: req.user?.id || 'anonymous',
                from: req.query.source || req.query.from,
                to: req.query.destination || req.query.to,
                resultsCount: Array.isArray(data) ? data.length : data?.buses?.length || 0,
                userAgent: req.get('User-Agent')
            };
            
            // Log asynchronously (don't wait)
            searchLogger.logSearch(searchData).catch(console.error);
        }
        
        // Call original json method
        return originalJson.call(this, data);
    };
    
    next();
};