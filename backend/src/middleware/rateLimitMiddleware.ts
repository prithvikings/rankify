import { Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AuthRequest } from "./authMiddleware";
import User from "../models/User";

// 1. Basic IP Rate Limiting (Protects against rapid-fire spam)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Plan-based Quota Limiting (Protects your wallet and worker nodes)
export const checkScanQuota = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const today = new Date();
    const resetDate = new Date(user.scanResetDate);

    // Reset if it's a new day in UTC
    if (
      today.getUTCDate() !== resetDate.getUTCDate() ||
      today.getUTCMonth() !== resetDate.getUTCMonth() ||
      today.getUTCFullYear() !== resetDate.getUTCFullYear()
    ) {
      user.dailyScanCount = 0;
      user.scanResetDate = today;
    }

    const limit = user.plan === "pro" ? 100 : 5;

    if (user.dailyScanCount >= limit) {
      res.status(429).json({
        error: `Quota exceeded. The ${user.plan} plan is limited to ${limit} scans per day.`,
      });
      return;
    }

    user.dailyScanCount += 1;
    await user.save();

    next();
  } catch (error) {
    console.error("Quota check error:", error);
    res.status(500).json({ error: "Internal server error verifying quotas" });
  }
};
