import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const MonthlyTrainingSchema = new mongoose.Schema(
  {
    plannedDate: {
      type: Date,
      required: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    instructor: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const TrainingPlanSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
      index: true,
    },

    year: {
      type: Number,
      index: true,
    },

    planItems: {
      type: [MonthlyTrainingSchema],
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Draft", "Approved"],
      default: "Approved",
      index: true,
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   PRE-VALIDATE HOOK (runs before validation)
----------------------------------------- */
TrainingPlanSchema.pre("validate", async function () {
  // Set year from planItems before validation
  if (this.planItems?.length > 0) {
    const firstDate = new Date(this.planItems[0].plannedDate);
    this.year = firstDate.getFullYear();
  }
});

/* ----------------------------------------
   PRE-SAVE HOOK (runs after validation, before save)
----------------------------------------- */
TrainingPlanSchema.pre("save", async function () {
  // Generate formCode for new documents
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "TRAINING_PLAN" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
  }
});

export default mongoose.models.TrainingPlan ||
  mongoose.model("TrainingPlan", TrainingPlanSchema);
