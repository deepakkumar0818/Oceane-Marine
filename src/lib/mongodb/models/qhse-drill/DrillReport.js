import mongoose from "mongoose";

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
   PARTICIPANT SUB-SCHEMA
----------------------------------------- */
const ParticipantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

/* ----------------------------------------
   DRILL REPORT SCHEMA
----------------------------------------- */
const DrillReportSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    drillNo: {
      type: String,
      required: true,
      trim: true,
    },

    drillDate: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      trim: true,
    },

    drillScenario: {
      type: String,
      required: true,
      trim: true,
    },

    participants: {
      type: [ParticipantSchema],
      required: true,
    },

    incidentProgression: {
      type: String,
      trim: true,
    },

    year: {
      type: Number,
      index: true,
    },

    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      index: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Completed"],
      default: "Draft",
      index: true,
    },

    completedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   PRE-VALIDATE HOOK: FORM CODE (runs before validation)
------------------------------------------ */
DrillReportSchema.pre("validate", async function () {
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "DRILL_REPORT" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
  }
});

export default mongoose.models.DrillReport ||
  mongoose.model("DrillReport", DrillReportSchema);