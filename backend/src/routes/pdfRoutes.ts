import { Router } from "express";
import {
  requestPdfGeneration,
  downloadPdf,
} from "../controllers/pdfController";
import { requireAuth } from "../middleware/authMiddleware";
import { apiLimiter } from "../middleware/rateLimitMiddleware";

const router = Router();

router.use(apiLimiter);
router.use(requireAuth);

router.post("/request", requestPdfGeneration);
router.get("/:exportId/download", downloadPdf);

export default router;
