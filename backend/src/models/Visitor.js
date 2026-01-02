const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true }, // Simple unique ID (cookie/localStorage)
    ipHash: { type: String }, // Hashed IP for loose uniqueness check if cookie is cleared
    lastVisit: { type: Date, default: Date.now },
    visits: { type: Number, default: 1 }
});

module.exports = mongoose.model('Visitor', VisitorSchema);
