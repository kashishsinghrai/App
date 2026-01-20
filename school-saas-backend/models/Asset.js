const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    title: { type: String, required: true },
    type: { type: String, enum: ["Videos", "Study Notes"], required: true },
    subject: { type: String, required: true },
    targetClass: { type: String, required: true },
    sourceLink: { type: String, required: true }, // URL for YouTube or GridFS path
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", AssetSchema);
