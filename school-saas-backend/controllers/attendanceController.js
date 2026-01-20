const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// Submit attendance for a class on a date
exports.submitAttendance = async (req, res) => {
  const { schoolId, className, date, records } = req.body;

  try {
    // Validate schoolId matches authenticated user (if needed)
    if (req.user.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if attendance already exists for this class/date
    let attendance = await Attendance.findOne({ schoolId, className, date });

    if (attendance) {
      return res
        .status(400)
        .json({ message: "Attendance already submitted for this date." });
    }

    // Create new attendance record
    attendance = new Attendance({
      schoolId,
      className,
      date: new Date(date),
      records,
      submittedBy: req.user._id,
    });

    await attendance.save();

    res
      .status(201)
      .json({ message: "Attendance submitted successfully", attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance for a class on a specific date (optional – for history)
exports.getAttendance = async (req, res) => {
  const { schoolId, className, date } = req.query;

  try {
    const attendance = await Attendance.findOne({
      schoolId,
      className,
      date,
    }).populate("records.studentId", "name rollNo");

    if (!attendance) {
      return res.status(404).json({ message: "No attendance found" });
    }

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
