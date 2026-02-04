import mongoose from "mongoose";


// ================= DOCUMENT INFO (form no, revision) =================
const DocumentInfoSchema = new mongoose.Schema({
  formNo: String,
  revisionNo: String,
  issueDate: Date,
  approvedBy: String,
}, { _id: false });


// ================= PERSONAL DETAILS =================
const PersonalDetailsSchema = new mongoose.Schema({
    name: String,
    country: String,
    invoiceDate: Date,
    jobNumber: String,
    operationLocation: String
}, { _id: false });


// ================= BANK DETAILS =================
const BankDetailsSchema = new mongoose.Schema({
    accountHolderName: String,
    accountNumber: String,
    ibanOrSortCode: String,
    invoiceCurrency: String
}, { _id: false });


// ================= TRAVEL RECORD =================
const TravelRecordSchema = new mongoose.Schema({
    date: Date,
    time: String,
    remarks: String
}, { _id: false });


// ================= EXPENSE ROW =================
const ExpenseRowSchema = new mongoose.Schema({
    description: String,
    numberOfDaysOrMisc: String,
    dailyRate: Number,
    amount: Number,
    officeTotal: Number
}, { _id: false });


// ================= TOTALS =================
const TotalsSchema = new mongoose.Schema({
    subTotal: Number,
    vatAmount: Number,
    grandTotal: Number
}, { _id: false });


// ======================================================
// ================= MAIN SCHEMA =========================
// ======================================================

const MooringMasterExpenseSheetSchema = new mongoose.Schema({

    documentInfo: DocumentInfoSchema,

    personalDetails: PersonalDetailsSchema,

    bankDetails: BankDetailsSchema,


    travelDetails: {
        departureFromHomeTown: TravelRecordSchema,
        arrivalAtHomeTown: TravelRecordSchema
    },


    statementOfExpenses: [ExpenseRowSchema],


    totals: TotalsSchema,


    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "APPROVED", "PAID"],
        default: "DRAFT"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true });


export default mongoose.models.MooringMasterExpenseSheet ||
    mongoose.model(
        "MooringMasterExpenseSheet",
        MooringMasterExpenseSheetSchema
    );
