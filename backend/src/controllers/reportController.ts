import { Request, Response } from "express";
import Report from "../models/Report";
import Audit from "../models/Audit";
import AuditResult from "../models/AuditResult";
import { AuthRequest } from "../middleware/authMiddleware";

export const generateShareableLink = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { auditId } = req.body;

  if (!auditId) {
    res.status(400).json({ error: "auditId is required" });
    return;
  }

  try {
    // Ensure the audit belongs to the user
    const audit = await Audit.findOne({
      _id: auditId,
      userId: req.user?.userId,
    });

    if (!audit) {
      res.status(404).json({ error: "Audit not found or unauthorized" });
      return;
    }

    if (audit.status !== "completed") {
      res.status(400).json({ error: "Cannot share an incomplete audit" });
      return;
    }

    let report = await Report.findOne({ auditId });

    if (!report) {
      report = await Report.create({ auditId });
    }

    res.status(201).json({
      message: "Report link generated",
      publicId: report.publicId,
      shareUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/report/${report.publicId}`,
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { publicId } = req.params;

  try {
    const report = await Report.findOne({ publicId });

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const audit = await Audit.findById(report.auditId);
    const result = await AuditResult.findOne({ auditId: report.auditId });

    res.status(200).json({
      audit,
      result,
    });
  } catch (error) {
    console.error("Fetch public report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
