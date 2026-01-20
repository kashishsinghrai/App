const School = require("../models/School");
const Shop = require("../models/Shop");
const Asset = require("../models/Asset");
const Inquiry = require("../models/Inquiry");
const mongoose = require("mongoose");

/**
 * @desc    Search Institutes (Discovery Hub)
 * @route   GET /api/public/schools
 * @logic   Only returns Verified & Active schools with high ratings first.
 */
exports.searchSchools = async (req, res) => {
  try {
    const { query, city } = req.query;

    // Filter: Only show schools that have been audited by Super Admin
    let filter = { isVerified: true, isActive: true };

    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }
    if (city) {
      filter.address = { $regex: city, $options: "i" };
    }

    const schools = await School.find(filter)
      .select("name logo address rating contactNumber subscriptionPlan")
      .sort({ rating: -1 });

    res.status(200).json(schools);
  } catch (err) {
    console.error("Discovery Error:", err.message);
    res
      .status(500)
      .json({ message: "Cloud search is temporarily unavailable." });
  }
};

/**
 * @desc    Get Institutional Portfolio for Public View
 * @route   GET /api/public/school/:id
 */
exports.getSchoolPublicProfile = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).select(
      "name logo address contactNumber rating registrationNumber registrationDate"
    );

    if (!school || !school.isActive) {
      return res
        .status(404)
        .json({ message: "This institute is no longer listed." });
    }

    res.status(200).json(school);
  } catch (err) {
    res.status(500).json({ message: "Failed to sync with school records." });
  }
};

/**
 * @desc    Browse Marketplace (Vendors & Services)
 * @route   GET /api/public/marketplace
 */
exports.browseMarketplace = async (req, res) => {
  try {
    const { category } = req.query;

    // Only show vendors who are open for business (isOnline) and verified
    let filter = { isVerified: true, isOnline: true, isActive: true };

    if (category && category !== "All") {
      filter.category = category;
    }

    const shops = await Shop.find(filter)
      .select(
        "name shopImage address category rating portfolio rateList experience"
      )
      .sort({ rating: -1 });

    res.status(200).json(shops);
  } catch (err) {
    res.status(500).json({ message: "Marketplace feed could not be loaded." });
  }
};

/**
 * @desc    CRM Lead Submission (Admission Inquiry)
 * @route   POST /api/public/inquiry
 */
exports.submitInquiry = async (req, res) => {
  try {
    const { schoolId, parentName, studentName, phone, grade, message } =
      req.body;

    if (!schoolId || !parentName || !phone) {
      return res
        .status(400)
        .json({
          message: "Name and Phone are required to generate an inquiry.",
        });
    }

    // Creating a real lead record in Atlas Cloud
    const newLead = await Inquiry.create({
      schoolId,
      parentName,
      studentName,
      phone,
      grade,
      message,
    });

    res.status(201).json({
      message:
        "Success! Your inquiry has been transmitted to the school office.",
      leadId: newLead._id,
    });
  } catch (err) {
    console.error("CRM Post Error:", err.message);
    res
      .status(500)
      .json({ message: "Inquiry system failed. Please try later." });
  }
};

/**
 * @desc    Public LMS Hub: Access Skill-based content
 * @route   GET /api/public/courses
 */
exports.getOpenCourses = async (req, res) => {
  try {
    // Logic: Fetch assets where targetClass is 'Public' or specifically marked as free
    const publicAssets = await Asset.find({
      targetClass: { $in: ["Public", "General", "All"] },
    })
      .limit(12)
      .sort("-createdAt");

    res.status(200).json(publicAssets);
  } catch (err) {
    res.status(500).json({ message: "LMS Public cloud unreachable." });
  }
};
