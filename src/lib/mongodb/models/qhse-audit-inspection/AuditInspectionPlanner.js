import mongoose from "mongoose";
import Counter from "../generateFormCode";

const RowSchema = new mongoose.Schema(
  {
    rowId: { type: String, required: true },
    description: String,
    frequency: String,
    dueBy: String,
    status: String,
    auditorName: String,
    auditDate: Date,
    remarks: String,

    fileUrl: String,
    fileName: String,
    fileUploadedAt: Date,
  },
  { _id: false }
);

/* =========================
   Category
========================= */
const CategorySchema = new mongoose.Schema(
  {
    key: String,
    title: String,
    rows: [RowSchema],
  },
  { _id: false }
);

/* =========================
   Main Form
========================= */
const AuditInspectionPlannerSchema = new mongoose.Schema(
  {
    formCode: { type: String, unique: true },
    version: { type: String, required: true },
    issueDate: { type: Date, required: true },
    approvedBy: { type: String, required: true },

    status: {
      type: String,
      enum: ["Draft", "Submitted", "Approved"],
      default: "Draft",
    },

    categories: { type: [CategorySchema], required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/* =========================
   Auto formCode
========================= */
AuditInspectionPlannerSchema.pre("save", async function () {
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "AUDIT_INSPECTION_PLANNER" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
  }
});

export default mongoose.models.AuditInspectionPlanner ||
  mongoose.model("AuditInspectionPlanner", AuditInspectionPlannerSchema);
