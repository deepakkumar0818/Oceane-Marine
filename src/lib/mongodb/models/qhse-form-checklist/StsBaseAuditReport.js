import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const STSBaseAuditReportSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
    },

    filePath: {
      type: String,
      required: true,
    },

    version: {
      type: String,
      required: true,
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

STSBaseAuditReportSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "STS_BASE_AUDIT_REPORT" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("STS Base Audit Report Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.STSBaseAuditReport ||
  mongoose.model("STSBaseAuditReport", STSBaseAuditReportSchema);
