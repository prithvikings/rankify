import mongoose, { Schema, Document } from "mongoose";

export interface IMonitoringHistory extends Document {
  monitoringId: mongoose.Types.ObjectId;
  auditId: mongoose.Types.ObjectId;
  score: number;
  scanDate: Date;
}

const MonitoringHistorySchema: Schema = new Schema({
  monitoringId: {
    type: Schema.Types.ObjectId,
    ref: "Monitoring",
    required: true,
    index: true,
  },
  auditId: { type: Schema.Types.ObjectId, ref: "Audit", required: true },
  score: { type: Number, required: true },
  scanDate: { type: Date, default: Date.now },
});

export default mongoose.model<IMonitoringHistory>(
  "MonitoringHistory",
  MonitoringHistorySchema,
);
