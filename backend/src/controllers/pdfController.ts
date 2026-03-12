import { Request, Response } from "express";
import PdfExport from "../models/PdfExport";
import { AuthRequest } from "../middleware/authMiddleware";
import { pdfQueue } from "../queue/queues";

export const requestPdfGeneration = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { auditId } = req.body;
  const userId = req.user?.userId;

  if (!auditId) {
    res.status(400).json({ error: "auditId is required" });
    return;
  }

  try {
    // Create pending export record
    const pdfExport = await PdfExport.create({ auditId, userId });

    // Queue the heavy lifting
    await pdfQueue.add("generatePdf", {
      exportId: pdfExport._id.toString(),
      auditId,
    });

    res.status(202).json({
      message: "PDF generation started",
      exportId: pdfExport._id,
    });
  } catch (error) {
    console.error("Request PDF error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const downloadPdf = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { exportId } = req.params;
  const userId = req.user?.userId;

  try {
    const pdfExport = await PdfExport.findOne({ _id: exportId, userId });

    if (!pdfExport) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }

    if (pdfExport.status === "pending") {
      res.status(202).json({ message: "PDF is still generating" });
      return;
    }

    if (pdfExport.status === "failed" || !pdfExport.fileData) {
      res.status(500).json({ error: "PDF generation failed" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=seo-report-${pdfExport.auditId}.pdf`,
    );
    res.send(pdfExport.fileData);
  } catch (error) {
    console.error("Download PDF error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
