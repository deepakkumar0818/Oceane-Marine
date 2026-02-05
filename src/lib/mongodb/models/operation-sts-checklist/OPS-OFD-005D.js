import mongoose from "mongoose";

// ================= DOCUMENT INFO =================
const DocumentInfoSchema = new mongoose.Schema(
  {
    formNo: String,
    revisionNo: String,
    issueDate: Date,
    approvedBy: String,
  },
  { _id: false }
);

// ================= SHIP / TERMINAL NAMES (TOP) =================
const ShipTerminalNamesSchema = new mongoose.Schema(
  {
    terminalBerthedShip: String,
    outerShip: String,
    terminal: String,
  },
  { _id: false }
);

// ================= CHECKLIST ROW (4 COLUMNS: TERMINAL BERTHED | OUTER | TERMINAL | NOT APPLICABLE) =================
const DeclarationChecklistRowSchema = new mongoose.Schema(
  {
    checklistId: String, // e.g. "3A", "3B", "7", "4B", "4C", "4D", "4E", "4F"
    label: String,
    terminalBerthedShip: { type: Boolean, default: false },
    outerShip: { type: Boolean, default: false },
    terminal: { type: Boolean, default: false },
    notApplicable: { type: Boolean, default: false },
  },
  { _id: false }
);

// ================= SIGNATORY BLOCK (NAME, RANK, SIGNATURE, DATE, TIME) =================
const SignatoryBlockSchema = new mongoose.Schema(
  {
    name: String,
    rank: String,
    signature: String, // base64 or URL
    date: Date,
    time: String, // HH:MM
  },
  { _id: false }
);

// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSChecklist5DSchema = new mongoose.Schema(
  {
    // ===== HEADER =====
    documentInfo: DocumentInfoSchema,

    // ===== SHIP / TERMINAL NAMES =====
    shipTerminalNames: ShipTerminalNamesSchema,

    // ===== DECLARATION CHECKLIST (8 ROWS: 3A, 3B, 7, 4B, 4C, 4D, 4E, 4F) =====
    declarationChecklist: [DeclarationChecklistRowSchema],

    // ===== REPETITIVE CHECKS (HOURS) =====
    repetitiveChecksHours: String,

    // ===== SIGNATORIES (3 COLUMNS) =====
    terminalBerthedShipSignatory: SignatoryBlockSchema,
    outerShipSignatory: SignatoryBlockSchema,
    terminalSignatory: SignatoryBlockSchema,

    // ===== WORKFLOW =====
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED"],
      default: "DRAFT",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.STSChecklist5D ||
  mongoose.model("STSChecklist5D", STSChecklist5DSchema);
