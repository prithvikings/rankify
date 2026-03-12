import { Router } from "express";
import {
  addMonitor,
  getMonitorHistory,
} from "../controllers/monitoringController";
import { requireAuth } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// Protect all monitoring routes with auth and rate limits
router.use(apiLimiter);
router.use(requireAuth);

router.post("/", addMonitor);
router.get("/:monitorId/history", getMonitorHistory);

export default router;
