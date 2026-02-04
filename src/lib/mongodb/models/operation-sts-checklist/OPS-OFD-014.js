import mongoose from "mongoose";


// ================= DOCUMENT INFO =================
const DocumentInfoSchema = new mongoose.Schema({
    formNo: String,
    revisionNo: String,
    issueDate: Date,
    approvedBy: String,
    page: String
}, { _id: false });


// ================= JOB INFO =================
const JobInfoSchema = new mongoose.Schema({
    jobNumber: String,
    date: Date,
    time: String,
    mooringMasterName: String,
    location: String,

    operationPhase: {
        type: String,
        enum: ["BEFORE_OPERATION", "AFTER_OPERATION"]
    }
}, { _id: false });


// =================================================
// ================= TABLE 1 — FENDER EQUIPMENT =====
// =================================================
const FenderEquipmentRowSchema = new mongoose.Schema({
    fenderId: String,
    endPlates: String,
    bShackle: String,
    swivel: String,
    secondShackle: String,
    mooringShackle: String,
    fenderBody: String,
    tires: String,
    pressure: String
}, { _id: false });


// =================================================
// ================= TABLE 2 — HOSE EQUIPMENT =======
// =================================================
const HoseEquipmentRowSchema = new mongoose.Schema({
    hoseId: String,
    endFlanges: String,
    bodyCondition: String,
    nutsBolts: String,
    markings: String
}, { _id: false });


// =================================================
// ================= TABLE 3 — OTHER EQUIPMENT ======
// =================================================
const OtherEquipmentRowSchema = new mongoose.Schema({
    equipmentId: String,
    gaskets: String,
    ropes: String,
    wires: String,
    billyPugh: String,
    liftingStrops: String
}, { _id: false });


// ================= SIGNATURE =================
const SignatureSchema = new mongoose.Schema({
    mooringMasterSignature: String
}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSEquipmentChecklistSchema = new mongoose.Schema({

    documentInfo: DocumentInfoSchema,

    jobInfo: JobInfoSchema,


    // TABLE ARRAYS (IMPORTANT)
    fenderEquipment: [FenderEquipmentRowSchema],

    hoseEquipment: [HoseEquipmentRowSchema],

    otherEquipment: [OtherEquipmentRowSchema],


    remarks: String,

    signatureBlock: SignatureSchema,


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


export default mongoose.models.STSEquipmentChecklist ||
    mongoose.model("STSEquipmentChecklist", STSEquipmentChecklistSchema);
