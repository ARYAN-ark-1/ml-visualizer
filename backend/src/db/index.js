const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect(config.db.mongoURI);
        logger.info('MongoDB Connected Successfully');
    } catch (err) {
        logger.error('MongoDB Connection Failed', err);
        process.exit(1);
    }
};

module.exports = connectDB;
