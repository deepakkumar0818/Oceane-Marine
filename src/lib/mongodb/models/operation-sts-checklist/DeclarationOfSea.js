import mongoose from "mongoose";

const ChecklistItemSchema = new mongoose.Schema({
    checklistCode: {
        type: String, // Example: 3A, 3B, 4A
        required: true
    },
    description: {
        type: String,
        required: true
    },
    selection: {
        type: String,
        enum: [
            "CONSTANT_HEADING",
            "MANOEUVRING",
            "NOT_APPLICABLE"
        ],
        required: true
    }
}, { _id: false });


const ShipSignatureSchema = new mongoose.Schema({
    name: String,
    rank: String,
    signature: String, // store image url or base64
    date: Date,
    time: String
}, { _id: false });


const STSDeclarationSchema = new mongoose.Schema({

    // ===== Document Info =====
    formNo: String,
    revisionNo: String,
    issueDate: Date,
    approvedBy: String,

    // ===== Ship Type Selection =====
    shipOperationType: {
        type: String,
        enum: [
            "CONSTANT_HEADING_OR_BERTHED",
            "MANOEUVRING_OR_OUTER"
        ],
        required: true
    },

    // ===== Declaration Agreement =====
    declarationAccepted: {
        type: Boolean,
        default: true
    },

    // ===== Checklist Table =====
    checklists: [ChecklistItemSchema],

    // ===== Repetitive Check Interval =====
    repetitiveCheckHours: {
        type: Number
    },

    // ===== Signature Section =====
    constantHeadingShip: ShipSignatureSchema,
    manoeuvringShip: ShipSignatureSchema,

    // ===== Version & Status =====
    version: {
        type: String,
        default: "1.0"
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    }

}, {
    timestamps: true
});


export default mongoose.models.STSDeclaration ||
    mongoose.model("STSDeclaration", STSDeclarationSchema);
