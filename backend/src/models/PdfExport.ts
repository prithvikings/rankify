import mongoose, { Schema, Document } from "mongoose";

export interface IPdfExport extends Document {
  auditId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "failed";
  fileData?: Buffer; // MVP ONLY: Replace with S3 URL in production
  createdAt: Date;
}

const PdfExportSchema: Schema = new Schema({
  auditId: { type: Schema.Types.ObjectId, ref: "Audit", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  fileData: { type: Buffer },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPdfExport>("PdfExport", PdfExportSchema);
