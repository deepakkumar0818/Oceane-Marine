import mongoose from "mongoose";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const getQuarterFromDate = (date) => {
  const d = new Date(date);
  const m = d.getMonth(); // 0-11
  return QUARTERS[Math.floor(m / 3)];
};
/* ----------------------------------------
   COUNTER SCHEMA (SAME FILE)
----------------------------------------- */
const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/* ----------------------------------------
   QUARTERLY PLAN SUB-SCHEMA
----------------------------------------- */
const QuarterlyDrillSchema = new mongoose.Schema(
  {
    plannedDate: { type: Date, required: true },
    quarter: { type: String, enum: QUARTERS, index: true },
    topic: { type: String, required: true, trim: true },
    instructor: { type: String, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["Draft", "Approved"], default: "Draft", index: true },
  },
  { _id: true } // keep subdoc ids so we can reference a specific plan item
);

/* ----------------------------------------
   DRILL PLAN (ANNUAL MATRIX)
----------------------------------------- */
const DrillPlanSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
      index: true,
    },

    // Year for the drill plan
    year: {
      type: Number,
      required: true,
      index: true,
    },

    planItems: {
      type: [QuarterlyDrillSchema],
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   PRE-SAVE HOOK (runs after validation, before save)
----------------------------------------- */
DrillPlanSchema.pre("save", async function () {
  // Generate formCode for new documents
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "DRILL_PLAN" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
  }
});

DrillPlanSchema.pre("validate", function () {
  if (Array.isArray(this.planItems)) {
    this.planItems = this.planItems.map((item) => ({
      ...item,
      quarter: item.quarter || getQuarterFromDate(item.plannedDate),
      status: item.status || "Draft",
    }));
  }
});

// Ensure the model is properly exported
const DrillPlan = mongoose.models.DrillPlan || mongoose.model("DrillPlan", DrillPlanSchema);

export default DrillPlan;