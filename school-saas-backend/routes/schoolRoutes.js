const express = require("express");
const router = express.Router();
const { upload, waitForDb } = require("../utils/s3Upload");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Import ALL functions from the controller
const {
  getSchoolStats,
  getSchoolProfile,
  updateSchoolProfile,
  updateLogo,
  createStudent,
  getStudents,
  bulkLockStudents,
  allotShop,
  uploadLMSContent,
  getLMSContent,
  deleteLMSContent,
  postNotice,
  getNotices,
  getInquiries,
  submitAttendance,
  publishResult,
  updateTemplate,
} = require("../controllers/schoolController");

/**
 * ROOT MIDDLEWARE: Every route below this needs a valid token
 */
router.use(protect);

// --- 1. PROFILE MANAGEMENT ---
router.get("/profile/:id", getSchoolProfile);
router.put("/profile/:id", authorize("school"), updateSchoolProfile);
router.put(
  "/update-logo/:id",
  authorize("school"),
  upload.single("logo"),
  updateLogo
);

// --- 2. ANALYTICS ---
router.get("/stats/:schoolId", authorize("school", "admin"), getSchoolStats);

// --- 3. ERP - STUDENT MANAGEMENT ---
router.get("/students/:schoolId", authorize("school", "admin"), getStudents);
router.post("/create-student", authorize("school"), createStudent);
router.put("/bulk-lock", authorize("school"), bulkLockStudents);

// --- 4. LMS - DIGITAL LIBRARY ---
router.post("/lms/upload", authorize("school"), uploadLMSContent);
router.get("/lms/:schoolId", authorize("school", "student"), getLMSContent);
router.delete("/lms/:id", authorize("school"), deleteLMSContent);

// --- 5. CRM - NOTICE BOARD & INQUIRIES ---
router.post("/notice", authorize("school"), postNotice);
router.get("/notices/:schoolId", getNotices);
// Check Line 47: Ensuring getInquiries is not undefined
router.get("/inquiries/:schoolId", authorize("school"), getInquiries);

// --- 6. OPERATIONS ---
router.post("/attendance/submit", authorize("school"), submitAttendance);
router.post("/results/publish", authorize("school"), publishResult);

// --- 7. DESIGNER & MARKETPLACE ---
router.post("/template/save/:schoolId", authorize("school"), updateTemplate);
router.post("/allot-shop", authorize("school"), allotShop);

module.exports = router;
