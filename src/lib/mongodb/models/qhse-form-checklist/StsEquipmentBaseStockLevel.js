import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const EquipmentItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "3.3mx6.5m"
    quantityInUse: { type: Number, default: 0 },
    quantitySpare: { type: Number, default: 0 },
    additionalComments: { type: String },
    overallCondition: {
      type: String,
      enum: ["Good", "Average", "Poor", "Not Assessed"],
      default: "Not Assessed",
    },
  },
  { _id: false }
);

/* ===========================
   EQUIPMENT CATEGORY
=========================== */
const EquipmentCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true, // FENDERS, HOSES, PPE, etc.
    },
    subCategory: {
      type: String, // CARGO / VAPOUR (optional)
    },
    items: [EquipmentItemSchema],
  },
  { _id: false }
);

/* ===========================
   MAIN SCHEMA
=========================== */
const STSEquipmentBaseStockSchema = new mongoose.Schema(
  {
    formCode: { type: String, unique: true },
    
    version: {
      type: String,
      default: "1.0",
    },

    revisionDate: {
      type: Date,
    },

    equipmentCategories: [EquipmentCategorySchema],
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },


    filledBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      roleAtSubmission: String,
    },

    /* ---------- Approval (Read-only) ---------- */
    approvedBy: {
      name: String,
      designation: String, // CEO / Director
      approvedDate: Date,
    },

    /* ---------- Audit ---------- */
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ===========================
   FORM CODE GENERATOR
=========================== */
STSEquipmentBaseStockSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "STS_EQUIPMENT_BASE_STOCK" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (err) {
    console.error("STS Equipment Base Stock Pre-Save Error:", err);
    throw err;
  }
});

/* ===========================
   VERSION INCREMENT ON EDIT
=========================== */
STSEquipmentBaseStockSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update?.$set) {
    update.$set.updatedAt = new Date();
  }

  if (update?.$incVersion) {
    this.updateOne({}, { $set: { version: update.$incVersion } });
  }

  next();
});

export default mongoose.models.STSEquipmentBaseStock ||
  mongoose.model("STSEquipmentBaseStock", STSEquipmentBaseStockSchema);
