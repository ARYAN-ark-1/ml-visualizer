const Step = require("../models/Step");
const Metric = require("../models/Metric");
const engines = {
    kmeans: require("../engine/kmeans"),
    hierarchical: require("../engine/hierarchical"),
    apriori: require("../engine/apriori"),
    fpgrowth: require("../engine/fpgrowth")
};

module.exports = async function runExperiment({ experimentId, algorithm, points, params }) {
    const start = Date.now();
    let stepNo = 0;

    try {
        const engine = engines[algorithm.toLowerCase()];
        if (!engine) {
            throw new Error(`Unknown algorithm: ${algorithm}`);
        }

        // Determine input data: points for clustering, transactions (params.data) for association
        const data = points || params.transactions || [];

        // Run the generator engine
        for (const state of engine(data, params)) {
            await Step.create({
                experimentId,
                stepNo: stepNo++,
                state
            });
        }

        // Save Metrics after completion
        await Metric.create({
            experimentId,
            executionTimeMs: Date.now() - start,
            stepsCount: stepNo
        });

        console.log(`Experiment ${experimentId} completed with ${stepNo} steps.`);
    } catch (error) {
        console.error(`Experiment ${experimentId} failed:`, error);
    }
};
