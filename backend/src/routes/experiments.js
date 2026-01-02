const express = require("express");
const router = express.Router();
const Experiment = require("../models/Experiment");
const engines = {
    kmeans: require("../engine/kmeans"),
    hierarchical: require("../engine/hierarchical"),
    apriori: require("../engine/apriori"),
    fpgrowth: require("../engine/fpgrowth")
};

// GET /api/experiments/run - Stream Steps Directly (No DB Steps)
router.get("/run", async (req, res) => {
    // Setup SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const { algorithm, k, numPoints, seed } = req.query;
        // Parse params
        const params = { k: parseInt(k) || 3 };

        // Reconstruct points/data from query if simple, or use body (but GET doesn't have body often)
        // For visualizing large data, POST is better, but for EventSource, GET is standard.
        // We'll accept a serialized 'points' query param for now or Generate them on backend for "Demo" mode logic
        // But the user's frontend generates points.
        // CHANGE: To support data passing, we'll use a POST-based SSE approach or just assume data is passed in query/body.
        // Limitation: EventSource native doesn't support POST body.
        // Workaround: We will use `fetch` with readable stream on frontend, OR stick to small data in query.
        // Better: The frontend generates points. Let's pass them via a standard POST and Stream response.
    } catch (err) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        res.end();
    }
});

// POST /api/experiments/run - Stream Result (Using Fetch Stream on frontend)
router.post("/run", async (req, res) => {
    // Headers for streaming
    res.setHeader("Content-Type", "text/plain"); // Or application/x-ndjson for cleanliness
    res.setHeader("Transfer-Encoding", "chunked");

    const start = Date.now();
    let stepNo = 0;

    try {
        const { algorithm, params, points, visitorId } = req.body;

        // Infer Dataset Metadata
        // Infer Dataset Metadata
        let dimension = 0;
        let range = [];
        if (points && points.length > 0) {
            const p0 = points[0];
            if (Array.isArray(p0)) dimension = p0.length;
            else if (typeof p0 === 'object' && p0 !== null) dimension = Object.keys(p0).filter(k => k !== 'id').length;

            // Calculate Range (Simple min/max for 2D visualizer)
            if (dimension === 2) {
                const xVals = points.map(p => p.x !== undefined ? p.x : p[0]);
                const yVals = points.map(p => p.y !== undefined ? p.y : p[1]);
                range = [Math.min(...xVals, ...yVals), Math.max(...xVals, ...yVals)];
            }
        }

        const dataset = {
            type: params.type || 'random',
            dimension,
            pointCount: points ? points.length : 0,
            range
        };


        // 1. Generate Content Hash (Algo + Params + Data + Visitor)
        const crypto = require('crypto');
        const hashPayload = JSON.stringify({ algorithm, params, points, visitorId });
        const contentHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

        // 2. Check for Duplicate
        let experiment = await Experiment.findOne({ contentHash });
        let isDuplicate = false;

        if (experiment) {
            isDuplicate = true;
            // Update last accessed or similar if needed? 
            // For now, just reuse ID.
        } else {
            // Create New
            experiment = await Experiment.create({
                visitorId,
                algorithm,
                params,
                dataset,
                contentHash
            });
        }

        const engine = engines[algorithm.toLowerCase()];
        if (!engine) throw new Error("Unknown algorithm");

        // 2. Run & Stream
        const data = points || params.data || [];
        let resultSummary = {};

        // Send Metadata first
        res.write(JSON.stringify({ type: 'meta', experimentId: experiment._id }) + "\n");


        for (const state of engine(data, params)) {
            if (state.phase === 'complete') {
                resultSummary = state.summary;
                continue; // Don't stream this internal summary step
            }
            const stepData = JSON.stringify({ stepNo: stepNo++, state });
            res.write(`${stepData}\n`); // NDJSON format
        }

        // 3. Update Metrics & Result Summary
        const end = Date.now();

        experiment.metrics = {
            executionTimeMs: end - start,
            stepsCount: stepNo,
            completedAt: new Date()
        };
        experiment.resultSummary = resultSummary;

        if (!isDuplicate) {
            await experiment.save();
        }

        res.end();
    } catch (err) {
        console.error("Experiment Error:", err);
        res.status(500).write(JSON.stringify({ error: err.message }));
        res.end();
    }
});

// GET /api/experiments/:id - Retrieve Experiment
router.get("/:id", async (req, res) => {
    try {
        const experiment = await Experiment.findById(req.params.id);
        if (!experiment) return res.status(404).json({ error: "Experiment not found" });
        res.json(experiment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
