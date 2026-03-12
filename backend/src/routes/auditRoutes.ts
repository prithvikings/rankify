import { Router } from "express";
import { submitAudit, streamAudit } from "../controllers/auditController";
import { requireAuth } from "../middleware/authMiddleware";
import { apiLimiter, checkScanQuota } from "../middleware/rateLimitMiddleware";

const router = Router();

// Only authenticated users who haven't exceeded their quota can submit
router.post("/", apiLimiter, requireAuth, checkScanQuota, submitAudit);

// SSE streams don't need strict quota limiting, but keeping auth is smart
router.get("/:auditId/stream", requireAuth, streamAudit);

export default router;
