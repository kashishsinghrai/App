const Student = require("../models/Student");
const School = require("../models/School");
const { generateAdmitCardPDF } = require("../utils/pdfGenerator");

/**
 * @desc    Get complete student profile from Cloud
 * @route   GET /api/student/profile/:id
 */
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select("-password")
      .populate("schoolId", "name logo address contactNumber idCardTemplate");

    if (!student) {
      return res.status(404).json({ message: "Student records not found." });
    }
    res.status(200).json(student);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Cloud sync error while fetching profile." });
  }
};

/**
 * @desc    Update Identity Data & Portrait (Atlas GridFS)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { bloodGroup, emergencyContact, address, submitForVerification } =
      req.body;
    const student = await Student.findById(req.params.id);

    if (!student)
      return res.status(404).json({ message: "Student not found." });
    if (student.isLocked)
      return res.status(403).json({ message: "Profile is locked." });

    const updateData = { bloodGroup, emergencyContact, address };
    if (req.file) {
      updateData.photo = `/api/files/view/${req.file.filename}`;
    }
    if (submitForVerification === "true") {
      updateData.status = "Pending Verification";
    }

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Identity synchronized.", student: updated });
  } catch (err) {
    res.status(500).json({ message: "Cloud update failed." });
  }
};

/**
 * @desc    Fetch Academic Records
 */
exports.getAcademicRecords = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select(
      "results admitCardUrl"
    );
    res
      .status(200)
      .json({
        results: student?.results || [],
        admitCard: student?.admitCardUrl || null,
      });
  } catch (err) {
    res.status(500).json({ message: "Failed to load documents." });
  }
};

/**
 * @desc    LMS Portal Data
 */
exports.getLearningPortal = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "enrolledCourses.courseId"
    );
    res.status(200).json(student?.enrolledCourses || []);
  } catch (err) {
    res.status(500).json({ message: "LMS Server Error." });
  }
};

// --- NEW: SCHOOL ADMIN ACTIONS FOR STUDENTS ---

/**
 * @desc    Get all students of a school (Admin View)
 */
exports.getStudentsBySchool = async (req, res) => {
  try {
    const query = { schoolId: req.params.schoolId };
    if (req.query.class) query.class = req.query.class;

    const students = await Student.find(query)
      .sort("rollNo")
      .select("-password");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching school directory." });
  }
};

/**
 * @desc    Create student (Admin side)
 */
exports.createStudent = async (req, res) => {
  try {
    const { name, rollNo, class: className, schoolId } = req.body;
    const username = `STU${rollNo}${Math.floor(Math.random() * 1000)}`;

    const newStudent = await Student.create({
      name,
      rollNo,
      class: className,
      schoolId,
      username,
      password: "password123",
    });
    res.status(201).json(newStudent);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Student creation failed. Roll No might exist." });
  }
};

/**
 * @desc    Update student (Admin side)
 */
exports.updateStudent = async (req, res) => {
  try {
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed." });
  }
};

/**
 * @desc    Delete student (Admin side)
 */
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Student record purged." });
  } catch (err) {
    res.status(500).json({ message: "Delete operation failed." });
  }
};
