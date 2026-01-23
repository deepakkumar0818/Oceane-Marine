import mongoose from "mongoose";
import Counter from "../generateFormCode";

const YesNoNA = {
  type: String,
  enum: ["Yes", "No", "NA"],
  // required: true,
};

const QuestionSchema = new mongoose.Schema(
  {
    qNo: String,
    question: String,
    answer: YesNoNA,
    remarks: String,
  },
  { _id: false }
);

const STSTransferAuditSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },

    version: {
      type: String,
      default: "1.0",
    },

    revisionDate: {
      type: Date,
    },

    approvedBy: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    header: {
      locationName: String,
      date: Date,
      jobNo: String,
      dischargingVessel: String,
      receivingVessel: String,
    },

    /* =========================
       SECTION A – PRE-PLANNING
    ========================== */
    sectionA_PrePlanning: [QuestionSchema],

    /* =========================
       SECTION B – MOB → DEMOB
    ========================== */
    sectionB_MobilizationToDemobilization: [QuestionSchema],

    /* =========================
       SECTION C – SUPPORT CRAFT
    ========================== */
    sectionC_SupportCraft: [QuestionSchema],

    /* =========================
       SECTION D – STS EQUIPMENT
    ========================== */
    sectionD_STSEquipment: [QuestionSchema],

    /* =========================
       SECTION E – POST OPERATION
    ========================== */
    sectionE_PostOperation: [QuestionSchema],

    /* =========================
       COMMENTS
    ========================== */
    comments: {
      remarks: String,
    },

    completedBy: {
      name: String,
      date: Date,
      signatureUrl: String,
    },

    versionHistory: [
      {
        version: Number,
        submittedAt: Date,
        submittedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        snapshot: mongoose.Schema.Types.Mixed,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

STSTransferAuditSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "STS_TRANSFER_AUDIT" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("STS Transfer Audit Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.STSTransferAudit ||
  mongoose.model("STSTransferAudit", STSTransferAuditSchema);
