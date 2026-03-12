import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IReport extends Document {
  auditId: mongoose.Types.ObjectId;
  publicId: string;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  auditId: {
    type: Schema.Types.ObjectId,
    ref: "Audit",
    required: true,
    unique: true,
  },
  publicId: { type: String, default: uuidv4, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReport>("Report", ReportSchema);
