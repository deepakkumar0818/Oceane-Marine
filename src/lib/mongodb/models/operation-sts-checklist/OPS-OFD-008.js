import mongoose from "mongoose";


// ================= DOCUMENT INFO =================
const DocumentInfoSchema = new mongoose.Schema({
    formNo: String,
    revisionNo: String,
    revisionDate: Date,
    approvedBy: String,
}, { _id: false });


// ================= SIGNATURE =================
const SignatureSchema = new mongoose.Schema({
    signatureImage: String, // base64 or cloud URL
    stampImage: String
}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSChecklist8Schema = new mongoose.Schema({

    // ===== HEADER =====
    documentInfo: DocumentInfoSchema,


    // ===== FORM DATA =====
    jobReference: String,

    masterName: String,

    vesselName: String, // SS/MV

    signedDate: Date,

    signedTime: String, // HH:MM format

    timeZoneLabel: String, // LT or others if future needed


    // ===== SIGNATURE =====
    signatureBlock: SignatureSchema,


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


export default mongoose.models.STSChecklist8 ||
    mongoose.model("STSChecklist8", STSChecklist8Schema);
