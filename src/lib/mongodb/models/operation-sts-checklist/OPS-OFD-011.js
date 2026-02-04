import mongoose from "mongoose";


// ================= DOCUMENT INFO =================
const DocumentInfoSchema = new mongoose.Schema({
    formNo: String,
    revisionNo: String,
    issueDate: Date,
    approvedBy: String,
}, { _id: false });


// ================= SIGNATURE BLOCK =================
const SignatureBlockSchema = new mongoose.Schema({
    masterName: String,

    vesselName: String, // SS / MV

    signedDate: Date,

    signedTime: String, // HH:MM

    shipStampImage: String // base64 or cloud url
}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSStandingOrderSchema = new mongoose.Schema({

    // ===== HEADER =====
    documentInfo: DocumentInfoSchema,


    // ===== EDITABLE CONTENT =====
    superintendentSpecificInstructions: String,


    // ===== SIGNING =====
    signatureBlock: SignatureBlockSchema,


    // ===== WORKFLOW =====
    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "SIGNED", "ARCHIVED"],
        default: "DRAFT"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });


export default mongoose.models.STSStandingOrder ||
    mongoose.model("STSStandingOrder", STSStandingOrderSchema);
