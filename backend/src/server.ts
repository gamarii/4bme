import express from "express";
import cors from "cors";

import recommendationsRoute from "./routes/recommendations.js";
import decisionsRoute from "./routes/decisions.js";
import scheduleRoute from "./routes/schedule.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("4BME backend is running");
});

app.use("/api/recommendations", recommendationsRoute);
app.use("/api/decisions", decisionsRoute);
app.use("/api/schedule", scheduleRoute);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});