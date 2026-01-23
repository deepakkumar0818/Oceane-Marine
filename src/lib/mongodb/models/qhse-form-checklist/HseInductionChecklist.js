import mongoose from "mongoose";
import Counter from "../generateFormCode";

const HSEInductionChecklistSchema = new mongoose.Schema(
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

    approvedBy: {
      type: String,
    },

    /* =========================
       EMPLOYEE / CONTRACTOR DETAILS
    ========================= */
    employeeOrContractorName: {
      type: String,
      required: true,
    },

    dateOfInduction: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    /* =========================
       HSE INDUCTION CHECKLIST
    ========================= */
    hseChecklist: {
      hsePolicy: { type: Boolean, default: false },

      facilityTour: { type: Boolean, default: false },

      reportingFire: { type: Boolean, default: false },

      occupationalHazards: { type: Boolean, default: false },

      injuryIllnessNearMissReporting: {
        type: Boolean,
        default: false,
      },

      emergencyActionPlan: {
        type: Boolean,
        default: false,
      },

      wasteManagementProcedures: {
        type: Boolean,
        default: false,
      },

      ppeRequirements: {
        type: Boolean,
        default: false,
      },

      hazcomMsds: {
        type: Boolean,
        default: false,
      },

      spillReportingProcedures: {
        type: Boolean,
        default: false,
      },

      ergonomicsAwareness: {
        type: Boolean,
        default: false,
      },

      housekeepingExpectations: {
        type: Boolean,
        default: false,
      },

      disciplinaryProcedure: {
        type: Boolean,
        default: false,
      },
    },

    /* =========================
       JOB FUNCTION / FACILITY OPERATION
    ========================= */
    jobSpecificChecklist: {
      safeOperationOfToolsMachinery: {
        type: Boolean,
        default: false,
      },

      trainingAndCertificationRequirements: {
        type: Boolean,
        default: false,
      },

      riskAssessmentOverview: {
        type: Boolean,
        default: false,
      },

      safeLiftingAndBackInjuryPrevention: {
        type: Boolean,
        default: false,
      },

      craneOperationAndSlingInspection: {
        type: Boolean,
        default: false,
      },

      loadingUnloadingHandlingProcedures: {
        type: Boolean,
        default: false,
      },
    },

    signatures: {
      employeeSignature: {
        type: String,
      },

      employeeSignatureDate: {
        type: Date,
      },

      inductionGivenBySignature: {
        type: String,
      },
    },

    /* =========================
       SUBMISSION METADATA
    ========================= */
    submittedBy: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Rejected", "Approved"],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

HSEInductionChecklistSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formNo) {
      const counter = await Counter.findOneAndUpdate(
        { key: "HSE_INDUCTION_CHECKLIST" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formNo = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("HSE Induction Checklist Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.HSEInductionChecklist ||
  mongoose.model("HSEInductionChecklist", HSEInductionChecklistSchema);
