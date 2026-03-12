import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import puppeteer from "puppeteer";
import Audit from "../models/Audit";
import AuditResult from "../models/AuditResult";
import PdfExport from "../models/PdfExport";
import "dotenv/config";

import { connectDB } from "../config/db";
connectDB();

const worker = new Worker(
  "pdfQueue",
  async (job) => {
    const { exportId, auditId } = job.data;

    try {
      const audit = await Audit.findById(auditId);
      const result = await AuditResult.findOne({ auditId });

      if (!audit || !result) throw new Error("Audit data not found");

      // Build a rudimentary HTML template for the PDF
      const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { color: #333; }
                        .score { font-size: 24px; font-weight: bold; color: ${audit.score && audit.score > 80 ? "green" : "red"}; }
                        .issue { border-bottom: 1px solid #ccc; padding: 10px 0; }
                        .critical { color: red; font-weight: bold; }
                        .warning { color: orange; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>SEO Audit Report</h1>
                    <p><strong>URL:</strong> ${audit.url}</p>
                    <p><strong>Score:</strong> <span class="score">${audit.score}/100</span></p>
                    <p><strong>Date:</strong> ${audit.createdAt.toDateString()}</p>
                    <hr/>
                    <h2>Issues Found</h2>
                    ${result.issues
                      .map(
                        (i) => `
                        <div class="issue">
                            <p class="${i.severity}">[${i.severity.toUpperCase()}] ${i.type}</p>
                            <p><strong>Explanation:</strong> ${i.explanation || "N/A"}</p>
                            <p><strong>Fix:</strong> <code>${i.fix || "N/A"}</code></p>
                        </div>
                    `,
                      )
                      .join("")}
                </body>
            </html>
        `;

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

      await browser.close();

      await PdfExport.findByIdAndUpdate(exportId, {
        status: "completed",
        fileData: pdfBuffer,
      });
    } catch (error) {
      console.error(`PDF Worker Error for export ${exportId}:`, error);
      await PdfExport.findByIdAndUpdate(exportId, { status: "failed" });
    }
  },
  { connection: redisConnection, concurrency: 2 },
); // Cap concurrency to prevent CPU spikes

worker.on("failed", (job, err) => {
  console.error(`PDF job ${job?.id} failed with error ${err.message}`);
});
