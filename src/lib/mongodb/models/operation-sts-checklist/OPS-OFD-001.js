import mongoose from "mongoose";


// ================= CHECKLIST ITEM =================
const GenericCheckSchema = new mongoose.Schema({
    clNumber: {
        type: Number,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["YES", "NOT_APPLICABLE", "NO"],
        required: true
    },

    remarks: {
        type: String
    }

}, { _id: false });


// ================= SIGNATURE =================
const SignatureSchema = new mongoose.Schema({
    name: String,
    rank: String,

    signature: {
        type: String // image url or base64
    },

    date: Date

}, { _id: false });


// ================= MAIN SCHEMA =================
const STSChecklistOneSchema = new mongoose.Schema({

    // ===== DOCUMENT INFO =====
    formNo: String,
    revisionNo: String,
    revisionDate: Date,
    approvedBy: String,
    page: String,

    // ===== VESSEL DETAILS =====
    vesselDetails: {
        vesselName: String,
        shipOperator: String,
        charterer: String,
        stsOrganizer: String,

        plannedTransferDateTime: Date,
        transferLocation: String,
        cargo: String,

        constantHeadingOrBerthedShip: String,
        manoeuvringOrOuterShip: String,

        poacOrStsSuperintendent: String,
        applicableJointPlanOperation: String
    },

    // ===== GENERIC CHECKLIST TABLE =====
    genericChecks: [GenericCheckSchema],

    // ===== SIGNATURE =====
    signatureBlock: SignatureSchema,


    // ===== OPTIONAL WORKFLOW =====
    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "APPROVED"],
        default: "DRAFT"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {
    timestamps: true
});


export default mongoose.models.STSChecklistOne ||
    mongoose.model("STSChecklistOne", STSChecklistOneSchema);
