const jwt = require("jsonwebtoken");
const School = require("../models/School");
const Shop = require("../models/Shop");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const User = require("../models/User"); // Added for General/Normal Users

/**
 * PROTECT MIDDLEWARE
 * Verifies the JWT and ensures the account is still Active in the database.
 * This handles the "Kill Switch" logic for Super Admin oversight.
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. Authentication token missing." });
  }

  try {
    // 2. Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. SECURE CROSS-CHECK: Is the user still in our Cloud Database?
    // We map the role to the specific MongoDB collection for an optimized search.
    let user;
    const models = {
      school: School,
      shop: Shop,
      student: Student,
      admin: Admin,
      user: User, // Mapped for public/guest registered users
    };

    const TargetModel = models[decoded.role];

    if (!TargetModel) {
      return res
        .status(401)
        .json({ message: "Invalid role signature in session." });
    }

    // Performance Optimization: Only select active/verified status
    user = await TargetModel.findById(decoded.id).select(
      "isActive isVerified name"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Your account no longer exists in the system." });
    }

    // 4. SUSPENSION LOGIC (Super Admin Power)
    // If the account is marked 'isActive: false', immediately revoke access.
    if (user.isActive === false) {
      return res.status(403).json({
        message:
          "Your portal access has been suspended. Please contact the administrator.",
      });
    }

    // 5. ATTACH USER TO REQUEST
    // req.user now contains {id, role} plus minimal profile status
    req.user = {
      ...decoded,
      isVerified: user.isVerified,
    };

    next();
  } catch (err) {
    console.error("JWT Sync Error:", err.message);
    return res
      .status(401)
      .json({ message: "Session expired or corrupted. Please sign in again." });
  }
};

/**
 * AUTHORIZE MIDDLEWARE
 * Enforces Role-Based Access Control (RBAC).
 * Example: router.post('/publish', protect, authorize('admin', 'school'))
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the role attached during 'protect' matches the allowed roles for this route
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Security Protocol: Role '${req.user?.role}' is not authorized to perform this operation.`,
      });
    }
    next();
  };
};
