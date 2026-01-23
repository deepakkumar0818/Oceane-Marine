import mongoose from "mongoose";

const equipmentUsageSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment", // ✅ FIXED
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: Date,

    usedHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["IN_USE", "RELEASED"],
      default: "IN_USE",
    },
  },
  { _id: false }
);

const stsOperationSchema = new mongoose.Schema(
  {
    parentOperationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    version: { type: Number, default: 1 },
    isLatest: { type: Boolean, default: true },

    Operation_Ref_No: {
      type: String,
      required: true,
      index: true,
    },

    typeOfOperation: String,

    mooringMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MooringMaster",
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location"
    },

    client: String,

    operationStatus: {
      type: String,
      enum: ["INPROGRESS", "COMPLETED", "CANCELED", "PENDING"],
      default: "INPROGRESS",
    },

    operationStartTime: {
      type: Date,
      required: true,
    },

    operationEndTime: Date,

    flowDirection: {
      type: String,
      enum: ["left", "right", "both"],
      default: "left",
    },

    quantity: Number,

    typeOfCargo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CargoType"
    },

    equipments: [equipmentUsageSchema],

    chs: String,
    ms: String,

    remarks: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

stsOperationSchema.index({ "equipments.equipment": 1 });
stsOperationSchema.index({ operationStartTime: -1 });

export default mongoose.models.StsOperation ||
  mongoose.model("StsOperation", stsOperationSchema);
