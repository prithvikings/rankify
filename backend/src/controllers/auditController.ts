import { Request, Response } from "express";
import { isValidUrl } from "../utils/urlValidator";
import Audit from "../models/Audit";
import { scanQueue } from "../queue/queues";
import { redisConnection } from "../config/redis";

export const submitAudit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    res.status(400).json({ error: "A valid HTTP/HTTPS URL is required" });
    return;
  }

  try {
    const audit = await Audit.create({
      userId: (req as any).user.userId, // Cast required if using strict types without module augmentation
      url,
      status: "queued",
    });

    await scanQueue.add("analyzePage", { auditId: audit._id.toString(), url });

    res.status(202).json({
      auditId: audit._id,
      message: "Audit queued successfully.",
      streamUrl: `/api/audits/${audit._id}/stream`,
    });
  } catch (error) {
    console.error("Audit submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const streamAudit = (req: Request, res: Response): void => {
  const { auditId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const subscriber = redisConnection.duplicate();
  subscriber.subscribe(`audit_events:${auditId}`);

  subscriber.on("message", (channel, message) => {
    const payload = JSON.parse(message);
    res.write(`data: ${message}\n\n`);

    if (payload.status === "completed" || payload.status === "failed") {
      subscriber.unsubscribe();
      subscriber.quit();
      res.end();
    }
  });

  req.on("close", () => {
    subscriber.unsubscribe();
    subscriber.quit();
  });
};
