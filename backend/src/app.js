const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ml-visualizer-seven.vercel.app",
        "https://ml-visualizer.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// Load routes
app.use("/api/experiments", require("./routes/experiments"));
app.use("/api/analytics", require("./routes/analytics"));

// Basic health check
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

module.exports = app;
