const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    parentName: { type: String, required: true },
    studentName: { type: String },
    phone: { type: String, required: true },
    grade: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ["New", "Contacted", "Closed"],
      default: "New",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", InquirySchema);
