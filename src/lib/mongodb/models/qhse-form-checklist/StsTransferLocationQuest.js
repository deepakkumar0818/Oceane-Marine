import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const STSTransferLocationQuestSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    version: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    locationName: {
      type: String,
      required: true,
    },

    uploadedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

STSTransferLocationQuestSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "STS_TRANSFER_LOCATION_QUEST" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-STT-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("STS Transfer Location Quest Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.STSTransferLocationQuest ||
  mongoose.model("STSTransferLocationQuest", STSTransferLocationQuestSchema);
