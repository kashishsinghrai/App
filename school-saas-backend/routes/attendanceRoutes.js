const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const attendanceController = require("../controllers/attendanceController");

// All routes protected + school admin only
router.use(protect);
router.use(authorize("school"));

// Submit attendance
router.post("/submit", attendanceController.submitAttendance);

// Get attendance (optional)
router.get("/", attendanceController.getAttendance);

module.exports = router;
