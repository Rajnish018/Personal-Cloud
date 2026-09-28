import mongoose from "mongoose";

const storageSyncSchema = new mongoose.Schema({
  objectName: { type: String, required: true, index: true },
  operation: { type: String, enum: ["UPLOAD", "DELETE"], required: true, index: true },
  status: { type: String, enum: ["PENDING", "SYNCING", "FAILED"], default: "PENDING", index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  nextRetryAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

storageSyncSchema.index({ objectName: 1, operation: 1 }, { unique: true });
export default mongoose.model("StorageSync", storageSyncSchema);
