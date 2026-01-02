require('dotenv').config();

module.exports = {
    port: process.env.PORT || 4000,
    db: {
        mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/ml_visualizer',
    }
};
