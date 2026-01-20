const Shop = require("../models/Shop");
const Student = require("../models/Student");
const School = require("../models/School");
const Ledger = require("../models/Ledger");
const { generateIDCardsPDF } = require("../utils/pdfGenerator");
const { parse } = require("json2csv"); // Using the stable parse method
const mongoose = require("mongoose");

/**
 * @desc    Get Shop profile & Dynamic Business Analytics
 * @route   GET /api/shop/profile/:id
 */
exports.getShopProfile = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).select("-password");
    if (!shop)
      return res.status(404).json({ message: "Vendor profile not found." });

    // Aggregate counts across collections for the Dashboard
    const [linkedSchoolsCount, totalLedgerEntries] = await Promise.all([
      School.countDocuments({ assignedShop: shop._id }),
      Ledger.countDocuments({ shopId: shop._id }),
    ]);

    res.status(200).json({
      ...shop._doc,
      linkedSchoolsCount,
      localCustomers: totalLedgerEntries,
      rating: 4.8,
    });
  } catch (err) {
    res.status(500).json({ message: "Cloud sync error fetching profile." });
  }
};

/**
 * @desc    Update Shop profile & Marketplace Visibility
 * @route   PUT /api/shop/profile/:id
 */
exports.updateShopProfile = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      address,
      services,
      isOnline,
      shopImage,
      rateList,
    } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          contactNumber,
          address,
          services,
          isOnline,
          shopImage,
          rateList,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!shop) return res.status(404).json({ message: "Shop not found." });
    res.status(200).json({ message: "Business records updated.", shop });
  } catch (err) {
    res.status(500).json({ message: "Cloud update failed." });
  }
};

/**
 * @desc    Get all Schools linked with this Shop for production
 * @route   GET /api/shop/linked-schools/:shopId
 */
exports.getLinkedSchools = async (req, res) => {
  try {
    const schools = await School.find({ assignedShop: req.params.shopId });

    const enrichedSchools = await Promise.all(
      schools.map(async (school) => {
        // Only count students whose data is Verified & Locked by School Admin
        const pendingCount = await Student.countDocuments({
          schoolId: school._id,
          isLocked: true,
        });

        return {
          _id: school._id,
          name: school.name,
          pendingCount,
          lastOrder: "Synced Now",
          type: "ID Card Production",
          location: school.address,
        };
      })
    );

    res.status(200).json(enrichedSchools);
  } catch (err) {
    res.status(500).json({ message: "Error loading institution directory." });
  }
};

/**
 * @desc    Get Verified Data for a specific school (Ready for Printing)
 * @route   GET /api/shop/locked-students/:schoolId
 */
exports.getLockedStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { className } = req.query;

    let query = { schoolId, isLocked: true };
    if (className && className !== "All") query.class = className;

    const students = await Student.find(query)
      .select("name rollNo class photo bloodGroup address")
      .sort({ rollNo: 1 });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: "Production data fetch failed." });
  }
};

/**
 * @desc    Export Data to CSV (Excel compatible) for Design Tools
 * @route   POST /api/shop/export-csv
 */
exports.exportToCSV = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || studentIds.length === 0)
      return res
        .status(400)
        .json({ message: "No students selected for export." });

    const students = await Student.find({ _id: { $in: studentIds } }).lean();

    const fields = [
      "name",
      "rollNo",
      "class",
      "bloodGroup",
      "address",
      "photo",
    ];
    const csv = parse(students, { fields });

    res.header("Content-Type", "text/csv");
    res.attachment(`Print_Data_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "CSV Export failed." });
  }
};

/**
 * @desc    Digital Ledger: Fetch local walk-in orders
 * @route   GET /api/shop/ledger/:shopId
 */
exports.getLedger = async (req, res) => {
  try {
    const entries = await Ledger.find({ shopId: req.params.shopId }).sort(
      "-createdAt"
    );
    res.status(200).json(entries);
  } catch (err) {
    res.status(500).json({ message: "Ledger records unreachable." });
  }
};

/**
 * @desc    Digital Ledger: Add new local order entry
 * @route   POST /api/shop/ledger/add
 */
exports.addLedgerEntry = async (req, res) => {
  try {
    const entry = await Ledger.create({ ...req.body });
    res
      .status(201)
      .json({ message: "Entry saved to Digital Register.", entry });
  } catch (err) {
    res.status(400).json({ message: "Invalid ledger data provided." });
  }
};

/**
 * @desc    Earnings Analytics: Get real-time revenue stats using MongoDB Aggregation
 * @route   GET /api/shop/earnings/:shopId
 */
exports.getEarningsStats = async (req, res) => {
  try {
    const shopId = req.params.shopId;

    // Use Aggregation to sum paid and pending amounts from Ledger
    const ledgerStats = await Ledger.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paid" },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const stats = ledgerStats[0] || { totalPaid: 0, totalAmount: 0 };
    const pending = stats.totalAmount - stats.totalPaid;

    res.status(200).json({
      totalEarnings: `₹${stats.totalPaid.toLocaleString("en-IN")}`,
      pendingEarnings: `₹${pending.toLocaleString("en-IN")}`,
      invoices: await Ledger.find({ shopId }).limit(15).sort("-createdAt"),
    });
  } catch (err) {
    res.status(500).json({ message: "Revenue calculation failed." });
  }
};

/**
 * @desc    Bulk PDF Production with Template Mapping
 */
exports.generatePDF = async (req, res) => {
  try {
    const { schoolId, className, studentIds } = req.body;

    let query = { schoolId, isLocked: true };
    if (studentIds) query._id = { $in: studentIds };
    else if (className) query.class = className;

    const students = await Student.find(query).populate("schoolId");
    const school = await School.findById(schoolId);

    if (!students || students.length === 0)
      return res.status(404).json({ message: "No production data found." });

    // Streams PDF directly to the frontend using the school's unique mapping
    generateIDCardsPDF(students, school, res);
  } catch (err) {
    res.status(500).json({ message: "PDF Production failed." });
  }
};
