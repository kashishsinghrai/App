const School = require("../models/School");
const Shop = require("../models/Shop");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const Notice = require("../models/Notice"); // For Global Broadcasts
const mongoose = require("mongoose");

/**
 * @desc    Get Global System Analytics (Live Data Only)
 * @route   GET /api/admin/analytics
 * @access  Private (Super Admin Only)
 */
exports.getSystemAnalytics = async (req, res) => {
  try {
    // Parallel counting for high performance across the entire Atlas Cluster
    const [
      schools,
      shops,
      students,
      pendingSchools,
      pendingShops,
      revenueData,
    ] = await Promise.all([
      School.countDocuments(),
      Shop.countDocuments(),
      Student.countDocuments(),
      School.countDocuments({ isVerified: false }),
      Shop.countDocuments({ isVerified: false }),
      // Real Revenue Logic: Summing up totalEarnings field from all active Shops
      Shop.aggregate([
        { $group: { _id: null, total: { $sum: "$totalEarnings" } } },
      ]),
    ]);

    const platformRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.status(200).json({
      totalEntities: schools + shops,
      stats: {
        schools,
        shops,
        students,
      },
      verificationQueue: {
        pendingSchools,
        pendingShops,
        totalPending: pendingSchools + pendingShops,
      },
      revenue: `₹${platformRevenue.toLocaleString("en-IN")}`,
      growthStatus: "Cloud Sync Active",
    });
  } catch (err) {
    console.error("SuperAdmin Analytics Error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to aggregate platform-wide metrics." });
  }
};

/**
 * @desc    Fetch all pending verification requests from both Schools and Vendors
 * @route   GET /api/admin/verify-requests
 */
exports.getVerificationRequests = async (req, res) => {
  try {
    const [schools, shops] = await Promise.all([
      School.find({ isVerified: false }).select("name email address createdAt"),
      Shop.find({ isVerified: false }).select(
        "name email address category createdAt"
      ),
    ]);

    res.status(200).json({
      pendingSchools: schools,
      pendingShops: shops,
    });
  } catch (err) {
    res.status(500).json({ message: "Cloud verification queue unreachable." });
  }
};

/**
 * @desc    Approve/Verify a School or Shop (Publish to Marketplace)
 * @route   PATCH /api/admin/verify/:id
 */
exports.verifyEntity = async (req, res) => {
  try {
    const { type } = req.body; // Expects 'school' or 'shop'
    const { id } = req.params;

    if (!["school", "shop"].includes(type)) {
      return res.status(400).json({ message: "Invalid entity type provided." });
    }

    const Model = type === "school" ? School : Shop;
    const entity = await Model.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!entity)
      return res.status(404).json({ message: "Record not found in Atlas." });

    res.status(200).json({
      message: `${entity.name} is now verified and live in the ecosystem.`,
      status: "Verified",
    });
  } catch (err) {
    res.status(500).json({ message: "Verification state update failed." });
  }
};

/**
 * @desc    The Platform "Kill Switch" (Global Suspend/Reactivate)
 * @route   PATCH /api/admin/toggle-status/:id
 */
exports.toggleEntityAccess = async (req, res) => {
  try {
    const { type, isActive } = req.body; // isActive: true/false
    const { id } = req.params;

    const models = { school: School, shop: Shop, student: Student };
    const TargetModel = models[type];

    if (!TargetModel)
      return res.status(400).json({ message: "Target role invalid." });

    const entity = await TargetModel.findByIdAndUpdate(
      id,
      { isActive: isActive },
      { new: true }
    );

    if (!entity)
      return res.status(404).json({ message: "User account not found." });

    const statusMsg = isActive ? "Account Reactivated" : "Access Suspended";
    res.status(200).json({
      message: `${entity.name}: ${statusMsg}.`,
      isActive: entity.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: "Critical status update failed." });
  }
};

/**
 * @desc    Broadcast Global Announcement (Push to all Portal Dashboards)
 * @route   POST /api/admin/broadcast
 */
exports.sendGlobalNotice = async (req, res) => {
  try {
    const { title, message, target } = req.body; // target: 'all', 'school', 'shop', 'student'

    // Create a notification record that all dashboards check on login
    const globalNotice = await Notice.create({
      title,
      content: message,
      category: "System",
      isImportant: true,
      targetRoles: [target], // Roles that will see this circular
    });

    res.status(201).json({
      message: "Platform-wide announcement broadcasted successfully.",
      notice: globalNotice,
    });
  } catch (err) {
    res.status(500).json({ message: "Broadcast server error." });
  }
};

/**
 * @desc    Permanent Purge (Admin Only Power)
 * @route   DELETE /api/admin/delete-entity/:id
 */
exports.deleteEntityPermanently = async (req, res) => {
  try {
    const { type } = req.query;
    const { id } = req.params;

    const Model = type === "school" ? School : Shop;
    const deleted = await Model.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ message: "Entity already removed." });

    res
      .status(200)
      .json({ message: "Record purged from Atlas Cloud permanently." });
  } catch (err) {
    res.status(500).json({ message: "Purge operation failed." });
  }
};
