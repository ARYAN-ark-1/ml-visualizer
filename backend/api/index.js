const app = require('../src/app');
const connectDB = require('../src/db/mongo');

connectDB(); // Ensure DB connects on cold start

module.exports = app;
