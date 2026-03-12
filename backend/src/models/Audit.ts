import mongoose, { Schema, Document } from "mongoose";

export interface IAudit extends Document {
  userId?: mongoose.Types.ObjectId;
  url: string;
  status: "queued" | "scanning" | "analyzing" | "completed" | "failed";
  score: number | null;
  createdAt: Date;
}

const AuditSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  url: { type: String, required: true },
  status: {
    type: String,
    enum: ["queued", "scanning", "analyzing", "completed", "failed"],
    default: "queued",
  },
  score: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAudit>("Audit", AuditSchema);
