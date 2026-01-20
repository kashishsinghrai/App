const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getSystemAnalytics,
  getVerificationRequests,
  verifyEntity,
  toggleEntityAccess,
} = require("../controllers/superAdminController");

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(authorize("admin"));

router.get("/analytics", getSystemAnalytics);
router.get("/verify-requests", getVerificationRequests);
router.patch("/verify/:id", verifyEntity);
router.patch("/toggle-status/:id", toggleEntityAccess);

module.exports = router;
