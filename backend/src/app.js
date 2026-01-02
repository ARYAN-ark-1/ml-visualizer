const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedDomains = [
            "http://localhost:5173",
            "https://ml-visualizer.vercel.app"
        ];

        const isVercelPreview = /^https:\/\/ml-visualizer.*\.vercel\.app$/;

        if (allowedDomains.includes(origin) || isVercelPreview.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS not allowed for origin: ${origin}`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Load routes
app.use("/api/experiments", require("./routes/experiments"));
app.use("/api/telemetry", require("./routes/telemetry"));

// Basic health check
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

module.exports = app;
