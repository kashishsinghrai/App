const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getShopProfile,
  updateShopProfile, // इसे जोड़ दिया गया है
  getLinkedSchools,
  getLockedStudents,
  exportToCSV,
  getLedger, // इसे जोड़ दिया गया है
  addLedgerEntry, // इसे जोड़ दिया गया है
  getEarningsStats, // इसे जोड़ दिया गया है
  generatePDF,
} = require("../controllers/shopController");

// सभी राउट्स के लिए लॉगिन अनिवार्य है
router.use(protect);

// --- Profile & Business Settings ---
router.get("/profile/:id", getShopProfile);
router.put("/profile/:id", authorize("shop"), updateShopProfile); // प्रोफाइल अपडेट के लिए

// --- B2B Marketplace Management ---
router.get(
  "/linked-schools/:shopId",
  authorize("shop", "admin"),
  getLinkedSchools
);

// --- Order & Production Hub ---
router.get(
  "/locked-students/:schoolId",
  authorize("shop", "admin"),
  getLockedStudents
);

// --- Digital Ledger (Khata) & Revenue ---
// पक्का करें कि ये फंक्शन्स shopController.js में मौजूद हैं
router.get("/ledger/:shopId", authorize("shop"), getLedger);
router.post("/ledger/add", authorize("shop"), addLedgerEntry);
router.get("/earnings/:shopId", authorize("shop"), getEarningsStats);

// --- Export & Printing Logic ---
router.post("/export-csv", authorize("shop"), exportToCSV);
router.post("/generate-pdf", authorize("shop"), generatePDF);

module.exports = router;
