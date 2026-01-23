import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const NearMissSchemaForms = new mongoose.Schema(
  {
    formCode: {
      type: String,
      unique: true,
      index: true,
    },
    JobRefNo: {
      type: String,
      required: true,
      trim: true,
    },
    VesselName: {
      type: String,
      required: true,
      trim: true,
    },
    timeOfIncident: {
      type: Date,
      required: true,
    },
    NameOfObserver: {
      type: String,
      required: true,
      trim: true,
    },
    PositionOfObserver: {
      type: String,
      enum: ["Mooring Master - POAC", "Management", "Third Party", "Other"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    TypeOfReporting: {
      type: String,
      enum: [
        "Near Miss",
        "Collision",
        "Fatality",
        "Injury",
        "Pollution",
        "Contact Damage",
        "Best Practice",
      ],
      required: true,
    },
    AreaOfNearMiss: {
      type: String,
      enum: [
        "Main Deck",
        "Bridge",
        "Offshore",
        "Support Craft",
        "Manifold Area",
        "Mobilization & Demobilization",
        "Transportation",
        "Cargo Control Room",
        "Underway / Anchoring",
        "Other",
      ],
      required: true,
    },
    Description: {
      type: String,
      required: true,
      trim: true,
    },
    ImmediateCause: {
      type: String,
      required: true,
      trim: true,
    },
    RootCause: {
      type: String,
      required: true,
      trim: true,
    },
    CorrectiveAction: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Under Review", "Reviewed"],
      default: "Under Review",
    },
    remarksByReviewer: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

NearMissSchemaForms.pre("save", async function () {
  if (this.isNew && !this.formCode) {
    const counter = await Counter.findOneAndUpdate(
      { key: "NEAR_MISS_FORMS" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.formCode = `QAF-NM-${String(counter.seq).padStart(3, "0")}`;
  }
});
export default mongoose.models.NearMissForms ||
  mongoose.model("NearMissForms", NearMissSchemaForms);
