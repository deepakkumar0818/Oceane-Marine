import mongoose from "mongoose";
import Counter from "../generateFormCode";

const ManualSchema = new mongoose.Schema(
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

ManualSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "MANUAL" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formCode = `OPS-MAN-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Manual Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.Manual ||
  mongoose.model("Manual", ManualSchema);
