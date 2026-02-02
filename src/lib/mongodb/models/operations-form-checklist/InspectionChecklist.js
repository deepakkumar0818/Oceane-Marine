import mongoose from "mongoose";
import Counter from "../generateFormCode";

const InspectionChecklistSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0",
    },
    date: {
      type: Date,
      required: true,
    },
    uploadedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

InspectionChecklistSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "INSPECTION_CHECKLIST" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formCode = `OPS-INS-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Inspection Checklist Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.InspectionChecklist ||
  mongoose.model("InspectionChecklist", InspectionChecklistSchema);

