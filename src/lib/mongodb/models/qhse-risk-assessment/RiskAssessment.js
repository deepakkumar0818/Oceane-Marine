import mongoose from "mongoose";

const RiskAssessmentSchema = new mongoose.Schema(
  {
    locationName: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    filePath: { type: String, required: true }, // relative path on disk
    fileName: { type: String, required: true }, // original filename
    mimeType: { type: String },
    fileSize: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.RiskAssessment ||
  mongoose.model("RiskAssessment", RiskAssessmentSchema);