// ============================================
// SEARCH HISTORY ROUTES
// View search logs (admin only)
// ============================================

const express = require('express');
const router = express.Router();
const searchLogger = require('../utils/searchLogger');
const authMiddleware = require('../middleware/auth.middleware');

// Get recent searches (protected)
router.get('/recent', authMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    
    searchLogger.getSearchHistory({ limit }, (result) => {
        res.json({
            success: true,
            ...result
        });
    });
});

// Get search statistics (protected)
router.get('/stats', authMiddleware, (req, res) => {
    searchLogger.getSearchStats((stats) => {
        res.json({
            success: true,
            ...stats
        });
    });
});

// Filter searches by date/city
router.get('/filter', authMiddleware, (req, res) => {
    const { fromDate, toDate, fromCity, toCity, limit } = req.query;
    
    searchLogger.getSearchHistory({
        fromDate,
        toDate,
        fromCity,
        toCity,
        limit: parseInt(limit) || 100
    }, (result) => {
        res.json({
            success: true,
            ...result
        });
    });
});

// Stream search log file (download)
router.get('/download', authMiddleware, (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../../logs/search-history.log');
    
    if (!fs.existsSync(logFile)) {
        return res.status(404).json({ error: 'No log file yet' });
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=search-history.log');
    
    // STREAM the file directly!
    const readStream = fs.createReadStream(logFile);
    readStream.pipe(res);
});

module.exports = router;    