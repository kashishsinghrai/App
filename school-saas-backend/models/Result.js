const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    rollNo: { type: String, required: true },
    examName: { type: String, default: "Final Term" },
    maths: { type: String },
    science: { type: String },
    english: { type: String },
    grade: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", ResultSchema);
