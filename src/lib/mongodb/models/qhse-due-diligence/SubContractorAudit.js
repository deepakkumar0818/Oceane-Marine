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
   SUB-CONTRACTOR AUDIT SCHEMA
----------------------------------------- */
const SubContractorAuditSchema = new mongoose.Schema(
  {
    // Auto-generated form number
    formCode: {
      type: String,
      unique: true,
      index: true, // QAF-OFD-055-001
    },

    /* -------- SUB-CONTRACTOR DETAILS -------- */
    subcontractorName: {
      type: String,
      required: true,
      trim: true,
    },

    subcontractorAddress: {
      type: String,
      required: true,
      trim: true,
    },

    serviceType: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    emailOfContactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    phoneOfContactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    operatingAreas: {
      type: String,
      trim: true,
    },

    /* -------- COMPLIANCE QUESTIONS -------- */
    tradeLicenseCopyAvailable: {
      type: Boolean,
      default: false,
    },

    hasHSEPolicy: {
      type: Boolean,
      default: false,
    },

    auditsSubcontractors: {
      type: Boolean,
      default: false,
    },

    hasInsurance: {
      type: Boolean,
      default: false,
    },

    insuranceDetails: {
      type: String,
      trim: true,
    },

    isoCertifications: {
      type: [String], // ISO 9001, ISO 14001, ISO 45001
      default: [],
    },

    /* -------- OFFICE USE -------- */
    auditCompletedBy: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      signedAt: { type: Date },
    },

    contractorApprovedBy: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      signedAt: { type: Date },
    },

    /* -------- STATUS -------- */
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ----------------------------------------
   PRE-SAVE HOOK: FORM CODE GENERATION
----------------------------------------- */
SubContractorAuditSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "SUB_CONTRACTOR_AUDIT" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Sub Contractor Audit Pre-Save Error:", error);
  }
});

export default mongoose.models.SubContractorAudit ||
  mongoose.model("SubContractorAudit", SubContractorAuditSchema);
