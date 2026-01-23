import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const AttendanceSchema = new mongoose.Schema(
  {
    traineeName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    signature: {
      type: String, 
    },
  },
  { _id: false }
);

/* ----------------------------------------
   TRAINING RECORD (EXECUTION)
----------------------------------------- */
const TrainingRecordSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    trainingPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingPlan",
      required: true,
      index: true,
    },

    plannedDate: {
      type: Date,
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    instructor: {
      type: String,
      required: true,
    },

    actualTrainingDate: {
      type: Date,
      required: true,
    },

    attendance: {
      type: [AttendanceSchema],
      required: true,
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

    recommendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    attachment: {
      filePath: {
        type: String,
      },
      fileName: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   PRE-VALIDATE HOOK: FORM CODE (runs before required check)
----------------------------------------- */
TrainingRecordSchema.pre("validate", async function () {
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "TRAINING_RECORD" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
  }
});

export default mongoose.models.TrainingRecord ||
  mongoose.model("TrainingRecord", TrainingRecordSchema);
