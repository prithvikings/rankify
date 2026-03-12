import cron from "node-cron";
import Monitoring from "../models/Monitoring";
import Audit from "../models/Audit";
import { scanQueue } from "../queue/queues";
import "dotenv/config";

import { connectDB } from "../config/db";
connectDB();

console.log("Monitoring Scheduler started...");

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Find up to 50 monitors that are active and due for a scan
    const dueMonitors = await Monitoring.find({
      isActive: true,
      nextRunAt: { $lte: now },
    }).limit(50);

    if (dueMonitors.length === 0) return;

    console.log(`Found ${dueMonitors.length} monitors due for scanning.`);

    for (const monitor of dueMonitors) {
      // 1. Create the Audit record
      const audit = await Audit.create({
        userId: monitor.userId,
        url: monitor.url,
        status: "queued",
      });

      // 2. Push to scan queue.
      // We pass monitorId so the AI worker knows to log this in MonitoringHistory when finished.
      await scanQueue.add("analyzePage", {
        auditId: audit._id.toString(),
        url: monitor.url,
        monitorId: monitor._id.toString(),
      });

      // 3. Calculate next run date to prevent duplicate scheduling
      const nextRun = new Date();
      if (monitor.frequency === "daily") {
        nextRun.setDate(nextRun.getDate() + 1);
      } else {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      monitor.nextRunAt = nextRun;
      await monitor.save();
    }
  } catch (error) {
    console.error("Scheduler Error:", error);
  }
});
