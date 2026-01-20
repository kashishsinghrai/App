const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent"],
          required: true,
        },
        absentReason: {
          type: String,
          default: "",
        },
      },
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique index per school + class + date (prevent duplicate attendance)
AttendanceSchema.index(
  { schoolId: 1, className: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
