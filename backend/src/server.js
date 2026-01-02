const app = require("./app");
const connectDB = require("./db/mongo");
const port = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

app.listen(port, () => console.log(`Backend running on ${port}`));
