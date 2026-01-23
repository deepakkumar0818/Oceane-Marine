import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const BestPracticeSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

BestPracticeSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "BEST_PRACTICE" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formCode = `QAF-BP-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Best Practice Pre-Save Error:", error);
  }
});

export default mongoose.models.BestPractice || mongoose.model("BestPractice", BestPracticeSchema);