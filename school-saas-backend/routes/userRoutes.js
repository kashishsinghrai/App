const express = require("express");
const router = express.Router();
const {
  searchSchools,
  browseMarketplace,
  submitInquiry,
} = require("../controllers/userController");

router.get("/search-schools", searchSchools);
router.get("/marketplace", browseMarketplace);
router.post("/admission-inquiry", submitInquiry);

module.exports = router;
