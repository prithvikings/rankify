import { Request, Response } from "express";
import Monitoring from "../models/Monitoring";
import MonitoringHistory from "../models/MonitoringHistory";
import { AuthRequest } from "../middleware/authMiddleware";
import { isValidUrl } from "../utils/urlValidator";

export const addMonitor = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { url, frequency } = req.body;
  const userId = req.user?.userId;

  if (!url || !isValidUrl(url)) {
    res.status(400).json({ error: "Valid URL is required" });
    return;
  }

  try {
    const existing = await Monitoring.findOne({ userId, url });
    if (existing) {
      res.status(400).json({ error: "You are already monitoring this URL" });
      return;
    }

    const monitor = await Monitoring.create({
      userId,
      url,
      frequency: frequency || "weekly",
      nextRunAt: new Date(), // Run immediately on first add
    });

    res.status(201).json(monitor);
  } catch (error) {
    console.error("Add monitor error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMonitorHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { monitorId } = req.params;
  const userId = req.user?.userId;

  try {
    const monitor = await Monitoring.findOne({ _id: monitorId, userId });
    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    // Fetch last 30 scans for charting
    const history = await MonitoringHistory.find({ monitoringId: monitorId })
      .sort({ scanDate: -1 })
      .limit(30)
      .populate("auditId", "status score");

    res.status(200).json({ monitor, history });
  } catch (error) {
    console.error("Get monitor history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
