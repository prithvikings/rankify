import mongoose, { Schema, Document } from "mongoose";

export interface IIssue {
  type: string;
  severity: "critical" | "warning" | "improvement";
  element: string;
  explanation?: string;
  fix?: string;
}

export interface IAuditResult extends Document {
  auditId: mongoose.Types.ObjectId;
  performanceMetrics: Record<string, any>;
  issues: IIssue[];
}

const IssueSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    severity: {
      type: String,
      enum: ["critical", "warning", "improvement"],
      required: true,
    },
    element: { type: String, required: true },
    explanation: { type: String },
    fix: { type: String },
  },
  { _id: false },
);

const AuditResultSchema: Schema = new Schema({
  auditId: {
    type: Schema.Types.ObjectId,
    ref: "Audit",
    required: true,
    index: true,
  },
  performanceMetrics: { type: Schema.Types.Mixed, default: {} },
  issues: [IssueSchema],
});

export default mongoose.model<IAuditResult>("AuditResult", AuditResultSchema);
