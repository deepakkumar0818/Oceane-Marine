import mongoose from "mongoose";


// ================= DOCUMENT INFO (form no, revision) =================
const DocumentInfoSchema = new mongoose.Schema({
  formNo: String,
  revisionNo: String,
  issueDate: Date,
  approvedBy: String,
}, { _id: false });


// ================= TRANSFER HEADER =================
const TransferHeaderSchema = new mongoose.Schema({

    dischargingShipName: String,

    receivingShipName: String,

    transferStartDate: Date,

    jobNumber: String

}, { _id: false });


// ================= HOURLY RECORD ROW =================
const HourlyRecordSchema = new mongoose.Schema({

    serialNumber: Number,

    date: Date,

    time: String, // HH:mm

    dischargedQuantity: Number,

    receivedQuantity: Number,

    differenceQuantity: Number,

    checkedBy: String, // name or signature url

}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const STSHourlyQuantityLogSchema = new mongoose.Schema({

    documentInfo: DocumentInfoSchema,

    transferInfo: TransferHeaderSchema,

    hourlyRecords: [HourlyRecordSchema],


    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "FINALIZED"],
        default: "DRAFT"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });


export default mongoose.models.STSHourlyQuantityLog ||
    mongoose.model(
        "STSHourlyQuantityLog",
        STSHourlyQuantityLogSchema
    );
