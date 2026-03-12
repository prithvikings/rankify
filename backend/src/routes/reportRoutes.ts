import { Router } from "express";
import {
  generateShareableLink,
  getPublicReport,
} from "../controllers/reportController";
import { requireAuth } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

// Apply IP rate limiting to all report routes
router.use(apiLimiter);

// Requires authentication to generate a link
router.post("/generate", requireAuth, generateShareableLink);

// Public route to view the report
router.get("/:publicId", getPublicReport);

export default router;
