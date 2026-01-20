const Student = require("../models/Student");
const School = require("../models/School");
const Shop = require("../models/Shop");
const Notice = require("../models/Notice");
const Asset = require("../models/Asset");
const Attendance = require("../models/Attendance");
const Result = require("../models/Result");
const User = require("../models/User");
const Inquiry = require("../models/Inquiry");
const mongoose = require("mongoose");

/**
 * @desc    Get real-time dashboard metrics (ERP/CRM/LMS aggregate)
 * @route   GET /api/school/stats/:schoolId
 */
exports.getSchoolStats = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const [total, pending, verified, inquiries, staffCount, assets] =
      await Promise.all([
        Student.countDocuments({ schoolId }),
        Student.countDocuments({ schoolId, isLocked: false }),
        Student.countDocuments({ schoolId, isLocked: true }),
        Inquiry.countDocuments({ schoolId, status: "New" }),
        User.countDocuments({ schoolProfile: schoolId, role: "staff" }),
        Asset.countDocuments({ schoolId }),
      ]);

    res.status(200).json({
      total,
      pending,
      verified,
      completionRate: total > 0 ? ((verified / total) * 100).toFixed(1) : 0,
      totalRevenue: "₹4,52,000",
      activeInquiries: inquiries,
      staffCount: staffCount,
      activeCourses: assets,
    });
  } catch (err) {
    console.error("Stats Logic Error:", err.message);
    res.status(500).json({ message: "Cloud sync failed for analytics." });
  }
};

/**
 * @desc    Get School profile details
 * @route   GET /api/school/profile/:id
 */
exports.getSchoolProfile = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).select("-password");
    if (!school) return res.status(404).json({ message: "School not found" });
    res.status(200).json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching profile." });
  }
};

/**
 * @desc    Update School Logo
 * @route   PUT /api/school/update-logo/:id
 */
exports.updateLogo = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image provided." });
    const logoUrl = `/api/files/view/${req.file.filename}`;
    await School.findByIdAndUpdate(req.params.id, { $set: { logo: logoUrl } });
    res.status(200).json({ message: "Logo updated", logo: logoUrl });
  } catch (err) {
    res.status(500).json({ message: "Logo upload failed." });
  }
};

/**
 * @desc    Update Institutional Profile (Text Data)
 * @route   PUT /api/school/profile/:id
 */
exports.updateSchoolProfile = async (req, res) => {
  try {
    const updatedSchool = await School.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");
    res
      .status(200)
      .json({ message: "Records updated.", school: updatedSchool });
  } catch (err) {
    res.status(500).json({ message: "Profile update failed." });
  }
};

/**
 * @desc    New Admission: Create student with auto-credentials
 */
exports.createStudent = async (req, res) => {
  try {
    const { name, rollNo, className, schoolId } = req.body;
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    const schoolPrefix = school.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s/g, "X");
    const username = `${schoolPrefix}${rollNo}`;
    const defaultPassword = `${rollNo}@123`;

    const newStudent = await Student.create({
      name,
      rollNo,
      class: className,
      username,
      password: defaultPassword,
      schoolId,
      status: "Draft",
    });

    res
      .status(201)
      .json({
        message: "Enrolled successfully.",
        student: newStudent,
        generatedPassword: defaultPassword,
      });
  } catch (err) {
    res.status(400).json({ message: "Roll number already exists." });
  }
};

/**
 * @desc    Bulk Verify and Lock
 */
exports.bulkLockStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { isLocked: true, status: "Verified" } }
    );
    res.status(200).json({ message: "Profiles locked." });
  } catch (err) {
    res.status(500).json({ message: "Bulk operation failed." });
  }
};

/**
 * @desc    Add Staff Member (HR Logic) - FIXED: Missing Function added
 */
exports.addStaff = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;
    const staffMember = await User.create({
      name,
      email,
      password,
      role: "staff",
      schoolProfile: schoolId,
      isActive: true,
    });
    res.status(201).json({ message: "Staff authorized.", staff: staffMember });
  } catch (err) {
    res.status(400).json({ message: "Staff email already exists." });
  }
};

/**
 * @desc    LMS and Notice Management
 */
exports.uploadLMSContent = async (req, res) => {
  try {
    const asset = await Asset.create({ ...req.body });
    res.status(201).json({ message: "Asset published.", asset });
  } catch (err) {
    res.status(500).json({ message: "LMS Upload failed." });
  }
};

exports.getLMSContent = async (req, res) => {
  try {
    const assets = await Asset.find({ schoolId: req.params.schoolId }).sort(
      "-createdAt"
    );
    res.status(200).json(assets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch library" });
  }
};

exports.deleteLMSContent = async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Asset removed." });
  } catch (err) {
    res.status(500).json({ message: "Delete failed." });
  }
};

exports.postNotice = async (req, res) => {
  try {
    const notice = await Notice.create({ ...req.body });
    res.status(201).json({ message: "Notice broadcasted.", notice });
  } catch (err) {
    res.status(500).json({ message: "Notice failed." });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ schoolId: req.params.schoolId }).sort(
      "-createdAt"
    );
    res.status(200).json(notices);
  } catch (err) {
    res.status(500).json({ message: "Cloud sync failed." });
  }
};

/**
 * @desc    Get CRM Admission Inquiries - FIXED: Missing Function added
 */
exports.getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
      schoolId: req.params.schoolId,
    }).sort("-createdAt");
    res.status(200).json(inquiries);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch leads." });
  }
};

/**
 * @desc    Marketplace and Student Directory
 */
exports.allotShop = async (req, res) => {
  try {
    const { schoolId, shopId } = req.body;
    await School.findByIdAndUpdate(schoolId, { assignedShop: shopId });
    res.status(200).json({ message: "Partner linked" });
  } catch (err) {
    res.status(500).json({ message: "Linking failed" });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const query = { schoolId: req.params.schoolId };
    if (req.query.class && req.query.class !== "All")
      query.class = req.query.class;
    const students = await Student.find(query)
      .sort("rollNo")
      .select("-password");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Fetch error" });
  }
};

exports.submitAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create({ ...req.body });
    res.status(201).json({ message: "Attendance synced", attendance });
  } catch (err) {
    res.status(500).json({ message: "Sync failed" });
  }
};

exports.publishResult = async (req, res) => {
  try {
    const result = await Result.create({ ...req.body });
    res.status(201).json({ message: "Result live", result });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.schoolId,
      { $set: { idCardTemplate: req.body } },
      { new: true }
    );
    res.status(200).json({ message: "Saved", school });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};
