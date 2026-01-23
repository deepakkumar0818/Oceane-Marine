import mongoose from "mongoose";

/* =========================
   COUNTER SCHEMA
========================= */
const CounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  year: { type: Number },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/* =========================
   EVALUATION ITEM SCHEMA
========================= */
const EvaluationItemSchema = new mongoose.Schema(
  {
    srNo: {
      type: Number,
      required: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    evaluation: {
      type: String,
      enum: [1, 2, 3, 4, 5],
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const PoacCrossCompetencySchema = new mongoose.Schema(
  {
    parentOperationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoacCrossCompetency",
    },

    isLatest: {
      type: Boolean,
      default: true,
    },

    formCode: {
      type: String,
      unique: true,
    },

    /* -------- Required -------- */
    nameOfPOAC: {
      type: String,
      required: true,
      trim: true,
    },

    evaluationDate: {
      type: Date,
      required: true,
    },

    jobRefNo: {
      type: String,
      required: true,
      trim: true,
    },

    leadPOAC: {
      type: String,
      required: true,
      trim: true,
    },

    /* -------- Optional -------- */
    dischargingVessel: { type: String, trim: true },
    receivingVessel: { type: String, trim: true },
    location: { type: String, trim: true },
    typeOfOperation: { type: String, trim: true },
    weatherCondition: { type: String, trim: true },

    deadweightDischarging: { type: Number },
    deadweightReceiving: { type: Number },

    revNo: {
      type: String,
      default: "1.1",
    },

    revDate: { type: Date },

    approvedBy: { type: String, trim: true },

    evaluationItems: {
      type: [EvaluationItemSchema],
      required: true,
    },

    /* -------- Comments -------- */
    leadPOACComment: { type: String, trim: true },
    leadPOACName: { type: String, trim: true },
    leadPOACDate: { type: Date },
    leadPOACSignature: { type: String, trim: true },

    opsSupportTeamComment: { type: String, trim: true },

    opsTeamName: { type: String, trim: true },
    opsTeamDate: { type: Date },
    opsTeamSignature: { type: String, trim: true },

    opsTeamSupdtName: { type: String, trim: true },
    opsTeamSupdtDate: { type: Date },
    opsTeamSupdtSignature: { type: String, trim: true },

    status: {
      type: String,
      enum: ["Draft", "Submitted", "Reviewed", "Approved"],
      default: "Draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

PoacCrossCompetencySchema.pre("save", async function () {
  if (!this.isNew) return;

  const year = new Date().getFullYear();
  const key = `poac-cross-competency-${year}`;

  let counter = await Counter.findOne({ key, year });
  if (!counter) {
    counter = await Counter.create({ key, year, seq: 0 });
  }

  counter.seq += 1;
  await counter.save();

  this.formCode = `POAC-${year}-${String(counter.seq).padStart(4, "0")}`;
});

const PoacCrossCompetency =
  mongoose.models.PoacCrossCompetency ||
  mongoose.model("PoacCrossCompetency", PoacCrossCompetencySchema);

export default PoacCrossCompetency;
