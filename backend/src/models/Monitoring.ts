import mongoose, { Schema, Document } from "mongoose";

export interface IMonitoring extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  frequency: "daily" | "weekly";
  isActive: boolean;
  lastScanDate: Date | null;
  nextRunAt: Date;
  createdAt: Date;
}

const MonitoringSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  url: { type: String, required: true },
  frequency: { type: String, enum: ["daily", "weekly"], default: "weekly" },
  isActive: { type: Boolean, default: true },
  lastScanDate: { type: Date, default: null },
  nextRunAt: { type: Date, default: Date.now, index: true }, // Indexed for fast scheduler queries
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can't monitor the exact same URL twice
MonitoringSchema.index({ userId: 1, url: 1 }, { unique: true });

export default mongoose.model<IMonitoring>("Monitoring", MonitoringSchema);
