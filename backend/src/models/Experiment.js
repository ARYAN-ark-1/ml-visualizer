const mongoose = require('mongoose');

const ExperimentSchema = new mongoose.Schema({
    visitorId: String,
    algorithm: String,
    params: Object, // Stores algo specific params (k, minSupport, seed, etc.)

    dataset: {
        type: { type: String, default: 'random' },
        dimension: Number,
        pointCount: Number,
        range: Array // Optional [min, max]
    },

    contentHash: { type: String, unique: true, index: true }, // Deduplication Key

    metrics: {
        executionTimeMs: Number,
        stepsCount: Number,
        completedAt: Date
    },

    resultSummary: Object, // Stores final outcome stats (SSE, Cluster Count, etc.)

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Experiment', ExperimentSchema);
