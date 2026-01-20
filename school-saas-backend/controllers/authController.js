const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Shop = require("../models/Shop");
const School = require("../models/School");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const User = require("../models/User"); // New model for General Users/Parents

/**
 * HELPER: Generates a JWT with role-based payload
 * Used for session persistence in the mobile app.
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * @desc    Unified Registration Handler
 * @route   POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { name, email, password, role, adminSecret, ...other } = req.body;

  // 1. Mandatory Validation
  if (!email || !password || !role || !name) {
    return res.status(400).json({
      message: "Required fields (name, email, password, role) are missing.",
    });
  }

  // 2. ADMIN PROTECTION Logic
  if (
    role === "admin" &&
    adminSecret !== process.env.ADMIN_REGISTRATION_SECRET
  ) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Invalid Admin Secret." });
  }

  const lowerEmail = email.toLowerCase();

  try {
    // 3. CROSS-PLATFORM UNIQUENESS CHECK
    // Ensures one email cannot be used for multiple identities across the ecosystem
    const [adminCheck, schoolCheck, shopCheck, studentCheck, userCheck] =
      await Promise.all([
        Admin.findOne({ email: lowerEmail }),
        School.findOne({ email: lowerEmail }),
        Shop.findOne({ email: lowerEmail }),
        Student.findOne({ email: lowerEmail }),
        User.findOne({ email: lowerEmail }),
      ]);

    if (adminCheck || schoolCheck || shopCheck || studentCheck || userCheck) {
      return res.status(400).json({
        message: "This email is already registered on the platform.",
      });
    }

    const userData = { ...other, name, email: lowerEmail, password };

    let newUser;
    switch (role) {
      case "school":
        newUser = await School.create(userData);
        break;
      case "shop":
        newUser = await Shop.create(userData);
        break;
      case "user":
        newUser = await User.create(userData);
        break;
      case "student":
        // Automatic username generation if not provided during API call
        if (!userData.username) userData.username = lowerEmail.split("@")[0];
        newUser = await Student.create(userData);
        break;
      case "admin":
        newUser = await Admin.create(userData);
        break;
      default:
        return res.status(400).json({ message: "Specified role is invalid." });
    }

    // 4. Respond with Token and minimal user data
    res.status(201).json({
      token: generateToken(newUser._id, role),
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: role,
        isVerified: newUser.isVerified || false,
      },
    });
  } catch (err) {
    console.error("Registration Logic Error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to create account due to server error." });
  }
};

/**
 * @desc    Optimized Role-Based Login
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  // 1. Validate incoming data
  if (!email || !password || !role) {
    return res.status(400).json({
      message:
        "Email, password, and targeted role are required for high-speed login.",
    });
  }

  const lowerEmail = email.toLowerCase();

  try {
    // 2. TARGETED LOOKUP: Maps role to specific collection (Zero scanning latency)
    const models = {
      school: School,
      shop: Shop,
      student: Student,
      admin: Admin,
      user: User,
    };

    const TargetModel = models[role];

    if (!TargetModel) {
      return res
        .status(400)
        .json({ message: "The selected role does not exist." });
    }

    // Fetch user with the hidden password field enabled
    const user = await TargetModel.findOne({ email: lowerEmail }).select(
      "+password"
    );

    if (!user) {
      return res
        .status(401)
        .json({
          message:
            "No account found with these credentials for the selected role.",
        });
    }

    // 3. ACCOUNT STATUS VERIFICATION (The "Kill Switch")
    // Prevents access if Super Admin has suspended the entity
    if (user.isActive === false) {
      return res.status(403).json({
        message:
          "Your portal access has been suspended. Please contact platform support.",
      });
    }

    // 4. PASSWORD VERIFICATION
    // Uses Schema method or falls back to direct bcrypt comparison
    let isMatch = false;
    if (user.matchPassword) {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 5. CONTEXTUAL SUCCESS RESPONSE
    // Returns specific state variables (assignedShop, isLocked) to optimize frontend rendering
    res.status(200).json({
      token: generateToken(user._id, role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        assignedShop: user.assignedShop || null,
        isLocked: user.isLocked || false,
        isVerified: user.isVerified || false,
      },
    });
  } catch (err) {
    console.error("Login Server Error:", err.message);
    res.status(500).json({ message: "Internal authentication error." });
  }
};
