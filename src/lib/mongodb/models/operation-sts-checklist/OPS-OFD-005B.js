import mongoose from "mongoose";


// ================= DOCUMENT INFO =================
const DocumentInfoSchema = new mongoose.Schema({
    formNo: String,
    revisionNo: String,
    revisionDate: Date,
    approvedBy: String,
}, { _id: false });


// ================= TRANSFER INFO =================
const TransferInfoSchema = new mongoose.Schema({
    constantHeadingShip: String,
    manoeuvringShip: String,
    designatedPOACName: String,
    stsSuperintendentName: String,
    transferDate: Date,
    transferLocation: String
}, { _id: false });


// ================= STATUS =================
const StatusSchema = new mongoose.Schema({
    yes: Boolean,
    notApplicable: Boolean
}, { _id: false });


// ================= CHECKLIST ITEM =================
const ChecklistItemSchema = new mongoose.Schema({
    clNumber: Number,
    description: String,
    status: StatusSchema,
    remarks: String
}, { _id: false });


// ================= SPECIAL PIPELINE CONDITION (CL 6A ITEM 2) =================
const PipelineConditionSchema = new mongoose.Schema({
    purged: Boolean,
    inerted: Boolean,
    depressurized: Boolean
}, { _id: false });


// ================= RESPONSIBLE PERSON BLOCK =================
const ResponsibleBlockSchema = new mongoose.Schema({
    chsOfficerName: String,
    msOfficerName: String,
    terminalName: String,
    stsSuperintendentName: String
}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSChecklist6ABSchema = new mongoose.Schema({

    // ===== HEADER =====
    documentInfo: DocumentInfoSchema,

    // ===== TRANSFER INFO =====
    transferInfo: TransferInfoSchema,


    // =================================================
    // ===== CHECKLIST 6A — BEFORE DISCONNECTION =====
    // =================================================
    checklist6A: {

        checks: [ChecklistItemSchema],

        pipelineConditions: PipelineConditionSchema
        // For CL 6A Row 2:
        // Purged / Inerted / Depressurized
    },


    // =================================================
    // ===== CHECKLIST 6B — BEFORE UNMOORING =====
    // =================================================
    checklist6B: [ChecklistItemSchema],


    // =================================================
    // ===== RESPONSIBLE PERSON CONFIRMATION =====
    // =================================================
    responsiblePersons: ResponsibleBlockSchema,


    // ===== WORKFLOW =====
    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "APPROVED"],
        default: "DRAFT"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });


export default mongoose.models.STSChecklist6AB ||
    mongoose.model("STSChecklist6AB", STSChecklist6ABSchema);
