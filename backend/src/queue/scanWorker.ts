import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { scanPage } from "../services/puppeteerService";
import { analyzeRawData } from "../utils/htmlParser";
import Audit from "../models/Audit";
import AuditResult from "../models/AuditResult";
import { aiQueue } from "./queues";
import mongoose from "mongoose";
import "dotenv/config";

import { connectDB } from "../config/db";
connectDB();

const worker = new Worker(
  "scanQueue",
  async (job) => {
    const { auditId, url } = job.data;
    const publisher = redisConnection.duplicate();

    try {
      await Audit.findByIdAndUpdate(auditId, { status: "scanning" });
      publisher.publish(
        `audit_events:${auditId}`,
        JSON.stringify({
          status: "scanning",
          message: "Extracting DOM and running heuristics...",
        }),
      );

      const rawData = await scanPage(url);
      const issues = analyzeRawData(rawData);

      await AuditResult.create({
        auditId: new mongoose.Types.ObjectId(auditId),
        performanceMetrics: { totalLinks: rawData.links },
        issues,
      });

      await Audit.findByIdAndUpdate(auditId, { status: "analyzing" });
      publisher.publish(
        `audit_events:${auditId}`,
        JSON.stringify({
          status: "analyzing",
          message: "Sending structured issues to AI for analysis...",
        }),
      );

      await aiQueue.add("generateExplanations", { auditId, issues });
    } catch (error: any) {
      console.error(`Scan Worker Error for ${auditId}:`, error);
      await Audit.findByIdAndUpdate(auditId, { status: "failed" });
      publisher.publish(
        `audit_events:${auditId}`,
        JSON.stringify({ status: "failed", error: error.message }),
      );
    } finally {
      publisher.quit();
    }
  },
  { connection: redisConnection, concurrency: 2 },
); // Hardcap concurrency to prevent OOM

worker.on("failed", (job, err) => {
  console.error(`Scan job ${job?.id} failed with error ${err.message}`);
});
