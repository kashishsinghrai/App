const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["Holiday", "Event", "Finance", "Exam", "General"],
      default: "General",
    },
    isImportant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", NoticeSchema);
