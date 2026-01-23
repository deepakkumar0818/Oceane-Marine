import mongoose from "mongoose";

const KpiUploadSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    publicId: { type: String, required: false }, // optional when storing locally
    url: { type: String, required: true },
    localPath: { type: String }, // local filesystem path (relative)
    size: { type: Number, required: true },
    mimeType: { type: String },
    year: { type: Number, index: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const KpiUpload =
  mongoose.models.KpiUpload || mongoose.model("KpiUpload", KpiUploadSchema);

export default KpiUpload;


