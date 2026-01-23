import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const VendorApprovalSchema = new mongoose.Schema(
  {
    formNo: {
      type: String,
      unique: true,
    },

    revisionNo: {
      type: String,
      default: "1.0",
    },

    revisionDate: {
      type: Date,
    },

    vendorName: {
      type: String,
      required: true,
    },
    
    vendorAddress: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    year: {
      type: Number,
      // Optional for backward compatibility, but required in form validation
    },

    /* =========================
       RATING SCALE
       1 = Not Satisfied
       2 = Need Improvement
       3 = Acceptable
       4 = Satisfied
    ========================= */

    /* ---------- FOR SUPPLY OF PARTS ---------- */
    supplyOfParts: {
      technicalComparison: {
        type: Number,
        min: 1,
        max: 4,
      },

      commercialComparison: {
        type: Number,
        min: 1,
        max: 4,
      },

      legalEntityForServiceOrSupply: {
        type: Number,
        min: 1,
        max: 4,
      },

      agreesToOceaneTerms: {
        type: Number,
        min: 1,
        max: 4,
      },

      infrastructureAndFacilities: {
        type: Number,
        min: 1,
        max: 4,
      },

      previousExperienceExpertise: {
        type: Number,
        min: 1,
        max: 4,
      },

      percentageScore: {
        type: Number, // stored value (calculated in backend)
        default: 0,
      },
    },

    /* ---------- FOR SUPPLY OF SERVICES ---------- */
    supplyOfServices: {
      skilledManpowerAvailability: {
        type: Number,
        min: 1,
        max: 4,
      },

      contractorCertifications: {
        type: Number,
        min: 1,
        max: 4,
      },

      hseSystemDueDiligence: {
        type: Number,
        min: 1,
        max: 4,
      },

      insuranceAndWorkPermit: {
        type: Number,
        min: 1,
        max: 4,
      },

      previousExperienceYears: {
        type: Number,
        min: 1,
        max: 4,
      },

      percentageScore: {
        type: Number,
        default: 0,
      },
    },

    /* =========================
       OVERALL RESULT
    ========================= */
    overallPercentageScore: {
      type: Number,
      default: 0,
    },

    approvedVendorEligible: {
      type: Boolean,
      default: false, // true if >= 80%
    },

    /* =========================
       SIGNATURES
    ========================= */

    requestedBy: {
      type: String,
      required: true,
    },

    forAccountsSign: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "DRAFT",
    },

    approvedBy: {
      // Store name / identifier of approver as a simple string for now
      type: String,
    },

    approvedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
    },

    instructionsToAccountsDepartment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

VendorApprovalSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formNo) {
      const counter = await Counter.findOneAndUpdate(
        { key: "VENDOR_SUPPLIER_APPROVAL" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.formNo = `QAF-VS-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Vendor Supplier Approval Pre-Save Error:", error);
  }
});

export default mongoose.models.VendorApproval ||
  mongoose.model("VendorApproval", VendorApprovalSchema);
