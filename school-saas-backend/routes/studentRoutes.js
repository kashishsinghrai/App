const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");

// FIXED: यहाँ { upload } का इस्तेमाल करें क्योंकि s3Upload.js एक ऑब्जेक्ट भेज रहा है
const { upload } = require("../utils/s3Upload");

// Controllers को मंगाएं
const {
  getProfile,
  updateProfile,
  getAcademicRecords,
  getLearningPortal,
  getStudentsBySchool,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

/**
 * GLOBAL MIDDLEWARE
 * All routes below require JWT authentication
 */
router.use(protect);

/**
 * ==========================================
 * STUDENT PORTAL ROUTES (Student role only)
 * ==========================================
 */

/**
 * @route   GET /api/student/profile/:id
 * @desc    Get complete student profile
 */
router.get("/profile/:id", getProfile);

/**
 * @route   PUT /api/student/profile/:id
 * @desc    Update student's own profile + upload photo (GridFS)
 */
router.put(
  "/profile/:id",
  authorize("student"),
  upload.single("photo"), // अब यह फंक्शन सही काम करेगा
  updateProfile,
);

/**
 * @route   GET /api/student/academics/:id
 * @desc    Get student's academic records
 */
router.get("/academics/:id", authorize("student"), getAcademicRecords);

/**
 * @route   GET /api/student/learning/:id
 * @desc    Get student's enrolled courses
 */
router.get("/learning/:id", authorize("student"), getLearningPortal);

/**
 * ==========================================
 * SCHOOL ADMIN ROUTES (School role only)
 * ==========================================
 */

/**
 * @route   GET /api/student/:schoolId
 * @desc    Get list of all students in a school
 */
router.get("/:schoolId", authorize("school"), getStudentsBySchool);

/**
 * @route   POST /api/student
 * @desc    Create a new student (Admin side)
 */
router.post("/", authorize("school"), upload.single("photo"), createStudent);

/**
 * @route   PUT /api/student/:id
 * @desc    Update existing student details
 */
router.put("/:id", authorize("school"), upload.single("photo"), updateStudent);

/**
 * @route   DELETE /api/student/:id
 * @desc    Delete a student record
 */
router.delete("/:id", authorize("school"), deleteStudent);

module.exports = router;
