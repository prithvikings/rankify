import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  dailyScanCount: number;
  scanResetDate: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  dailyScanCount: { type: Number, default: 0 },
  scanResetDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
