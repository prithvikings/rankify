import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/pdf", pdfRoutes);

// Global Error Handler Fallback
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke on the server." });
  },
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
