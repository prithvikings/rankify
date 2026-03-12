import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { generateExplanations } from "../services/geminiService";
import Audit from "../models/Audit";
import AuditResult from "../models/AuditResult";
import MonitoringHistory from "../models/MonitoringHistory";
import Monitoring from "../models/Monitoring";
import "dotenv/config";

import { connectDB } from "../config/db";
connectDB();

const worker = new Worker(
  "aiQueue",
  async (job) => {
    const { auditId, issues } = job.data;
    const publisher = redisConnection.duplicate();

    try {
      const enrichedIssues = await generateExplanations(issues);

      await AuditResult.findOneAndUpdate(
        { auditId },
        { $set: { issues: enrichedIssues } },
      );

      const finalScore = calculateScore(enrichedIssues);
      await Audit.findByIdAndUpdate(auditId, {
        status: "completed",
        score: finalScore,
      });

      // NEW: If this job came from the scheduler, log the history
      if (job.data.monitorId) {
        await MonitoringHistory.create({
          monitoringId: job.data.monitorId,
          auditId: auditId,
          score: finalScore,
        });

        await Monitoring.findByIdAndUpdate(job.data.monitorId, {
          lastScanDate: new Date(),
        });
      }

      publisher.publish(
        `audit_events:${auditId}`,
        JSON.stringify({ status: "completed", message: "Audit complete." }),
      );
    } catch (error: any) {
      console.error(`AI Worker Error for ${auditId}:`, error);
      await Audit.findByIdAndUpdate(auditId, { status: "failed" });
      publisher.publish(
        `audit_events:${auditId}`,
        JSON.stringify({ status: "failed", error: error.message }),
      );
    } finally {
      publisher.quit();
    }
  },
  { connection: redisConnection, concurrency: 10 },
); // High concurrency is fine for network I/O

function calculateScore(issues: any[]): number {
  const deductions = issues.reduce((acc, issue) => {
    if (issue.severity === "critical") return acc + 20;
    if (issue.severity === "warning") return acc + 5;
    return acc;
  }, 0);
  return Math.max(0, 100 - deductions);
}

worker.on("failed", (job, err) => {
  console.error(`AI job ${job?.id} failed with error ${err.message}`);
});
