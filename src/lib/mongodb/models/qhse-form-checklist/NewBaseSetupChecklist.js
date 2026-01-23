import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const NewBaseSetupChecklistSchema = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
    },

    baseName: {
      type: String,
      required: true,
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
  { timestamps: true }
);

NewBaseSetupChecklistSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.formCode) {
      const counter = await Counter.findOneAndUpdate(
        { key: "NEW_BASE_SETUP_CHECKLIST" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.formCode = `QAF-NBS-${String(counter.seq).padStart(3, "0")}`;
    }
  } catch (error) {
    console.error("New Base Setup Checklist Pre-Save Error:", error);
    throw error;
  }
});

export default mongoose.models.NewBaseSetupChecklist ||
  mongoose.model("NewBaseSetupChecklist", NewBaseSetupChecklistSchema);
