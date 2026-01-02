const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const crypto = require('crypto');

// Helper to hash IP for privacy
const hashIP = (ip) => crypto.createHash('sha256').update(ip).digest('hex');

// POST /api/analytics/visit
// Tracks a visit securely. Handles unique users + reload protection.
router.post('/visit', async (req, res) => {
    try {
        const { visitorId } = req.body; // Client-generated UUID stored in localStorage
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const ipHash = hashIP(ip);

        console.log(`[Analytics] Visit request. VisitorID: ${visitorId}, IP: ${ip} (${ipHash})`);

        // Logic:
        // 1. If visitorId exists in DB, check lastVisit.
        // 2. If visitorId is new, create new record.
        // 3. Prevent increment if lastVisit was < 24h ago (Reload Protection)

        let visitor = await Visitor.findOne({
            $or: [{ visitorId: visitorId }, { ipHash: ipHash }]
        });

        if (visitor) {
            // Check if visited recently (e.g. within 1 hour) to avoid reload spam
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            if (visitor.lastVisit < oneHourAgo) {
                visitor.visits += 1;
                visitor.lastVisit = Date.now();
                await visitor.save();
            }
        } else {
            // New Visitor
            visitor = new Visitor({
                visitorId: visitorId || crypto.randomUUID(),
                ipHash: ipHash
            });
            await visitor.save();
        }

        // Get total count
        const totalVisitors = await Visitor.countDocuments();

        res.json({
            status: 'tracked',
            visitorId: visitor.visitorId,
            totalVisitors
        });

    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Analytics failed', details: err.message });
    }
});

// GET /api/analytics/count
router.get('/count', async (req, res) => {
    try {
        const count = await Visitor.countDocuments();
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get count' });
    }
});

module.exports = router;
