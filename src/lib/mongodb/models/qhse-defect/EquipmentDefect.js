import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const EquipmentDefectSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
      index: true,
    },

    equipmentDefect: {
      type: String,
      required: true,
      trim: true,
    },

    base: {
      type: String,
      required: true,
      trim: true,
    },

    actionRequired: {
      type: String,
      required: true,
      trim: true,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    completionDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

EquipmentDefectSchema.pre("save", async function () {
  // In Mongoose 7, async middleware should not use the `next` callback
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "EQUIPMENT_DEFECT" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("Equipment Defect Pre-Save Error:", error);
  }
});

export default mongoose.models.EquipmentDefect ||
  mongoose.model("EquipmentDefect", EquipmentDefectSchema);
