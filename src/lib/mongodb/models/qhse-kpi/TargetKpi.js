import mongoose from "mongoose";
import Counter from "../generateFormCode";

const KpiRowSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetForYear: { type: Number, default: 0 },
    quarter1: { type: Number, default: 0 },
    quarter2: { type: Number, default: 0 },
    quarter3: { type: Number, default: 0 },
    quarter4: { type: Number, default: 0 },
    targetsAchieved: { type: Number, default: 0 },
  },
  { _id: false }
);

const TargetKpiSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, index: true },
    formCode: { type: String, unique: true },
    rows: {
      type: [KpiRowSchema],
      default: [],
    },
  },
  { timestamps: true }
);

TargetKpiSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "QHSE_TARGET_KPI" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formCode = `QHSE-TKPI-${String(counter.seq).padStart(4, "0")}`;
    }
  } catch (error) {
    console.error("TargetKpi pre-save error:", error);
    throw error;
  }
});

export default mongoose.models.TargetKpi ||
  mongoose.model("TargetKpi", TargetKpiSchema);
