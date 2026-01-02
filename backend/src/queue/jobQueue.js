const runExperiment = require("../services/experimentService");

const jobs = [];

exports.addJob = job => {
    jobs.push(job);
    // Process in next tick to avoid blocking event loop
    // In production, use a real message queue (Redis/Bull)
    process.nextTick(() => runExperiment(job));
};
