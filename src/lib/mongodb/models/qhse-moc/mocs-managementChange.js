import mongoose from "mongoose";

/* =========================
   COUNTER SCHEMA
========================= */
// Dedicated counter schema for MOC Management Change (avoid collisions)
const MOCManagementCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    year: { type: Number },
    seq: { type: Number, default: 0 },
  },
  { strict: true }
);

// Use a unique model name so it doesn't clash with other counters
const MOCManagementCounter =
  mongoose.models.MOCManagementCounter ||
  mongoose.model("MOCManagementCounter", MOCManagementCounterSchema);

/* =========================
   MOC MANAGEMENT CHANGE SCHEMA
========================= */
const MOCSchemaManagementChange = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },

    mocNumber: {
      type: String,
      unique: true,
    },

    proposedChange: {
      type: String,
      required: function () {
        // Required once form is moved out of Draft into active review (Open)
        return this.status === "Open";
      },
      trim: true,
    },

    reasonForChange: {
      type: String,
      required: function () {
        return this.status === "Open";
      },
      trim: true,
    },

    proposedBy: {
      type: String,
      required: function () {
        return this.status === "Open";
      },
    },

    mocInitiatedBy: {
      type: String,
      required: function () {
        return this.status === "Open";
      },
    },

    initiationDate: {
      type: Date,
      default: Date.now,
    },

    targetImplementationDate: Date,

    potentialConsequences: {
      environment: { type: Boolean, default: false },
      safety: { type: Boolean, default: false },
      contractual: { type: Boolean, default: false },
      cost: { type: Boolean, default: false },
      operational: { type: Boolean, default: false },
      reputation: { type: Boolean, default: false },
      remarks: String,
    },

    equipmentFacilityDocumentationAffected: String,

    riskAssessmentRequired: {
      type: Boolean,
      default: false,
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
    },

    reviewerComments: String,
    rejectionReason: String,

    changeMadeBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    changeDetails: String,
    changeCompletionDate: Date,

    trainingRequired: {
      type: Boolean,
      default: false,
    },

    trainingDetails: String,
    trainingCompleted: {
      type: Boolean,
      default: false,
    },
    trainingCompletionDate: Date,

    documentChangeRequired: {
      type: Boolean,
      default: false,
    },

    dcrNumber: String,

    status: {
      type: String,
      enum: ["Draft", "Open", "Closed"],
      default: "Draft",
    },
    statusReview: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

MOCSchemaManagementChange.pre("save", async function () {
  try {
    if (!this.isNew || this.formCode || this.mocNumber) return;

    const year = new Date().getFullYear();

    const formCounter = await MOCManagementCounter.findOneAndUpdate(
      { key: "MOC_FORM_CODE" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, strict: false }
    );

    // MOC Number Counter (year-based)
    const mocCounter = await MOCManagementCounter.findOneAndUpdate(
      { key: "MOC_NUMBER", year },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, strict: false }
    );

    const formSeq = String(formCounter.seq).padStart(3, "0");
    const mocSeq = String(mocCounter.seq).padStart(3, "0");

    this.formCode = `QAF-OFD-${formSeq}`;
    this.mocNumber = `MOC-${year}-${mocSeq}`;
  } catch (error) {
    console.error("MOC Management Change Pre-Save Error:", error);
    // bubble up to mongoose
    throw error;
  }
});

export default mongoose.models.MOCManagementChange ||
  mongoose.model("MOCManagementChange", MOCSchemaManagementChange);
