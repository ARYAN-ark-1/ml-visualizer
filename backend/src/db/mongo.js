const mongoose = require('mongoose');
const config = require('../config/env');

module.exports = async function connectDB() {
    try {
        await mongoose.connect(config.db.mongoURI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};
