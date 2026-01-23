import mongoose from "mongoose";

const mocRiskAssessmentFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const MOCRiskAssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Risk Assessment Upload",
    },
    files: {
      type: [mocRiskAssessmentFileSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one file is required",
      },
    },
    totalSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total size before saving
MOCRiskAssessmentSchema.pre("save", function () {
  if (this.files && this.files.length > 0) {
    this.totalSize = this.files.reduce((sum, file) => sum + (file.size || 0), 0);
  }
});

const MOCRiskAssessment =
  mongoose.models.MOCRiskAssessment ||
  mongoose.model("MOCRiskAssessment", MOCRiskAssessmentSchema);

export default MOCRiskAssessment;

