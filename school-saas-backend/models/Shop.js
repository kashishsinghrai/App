const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // FIXED: More robust email regex to prevent "Invalid email" validation errors
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/, 
        "Please fill a valid email address"
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Prevents password from being exposed in API results
    },
    role: {
      type: String,
      default: "shop",
      immutable: true,
    },

    // --- MARKETPLACE PROFILE ---
    shopImage: {
      type: String,
      default: "https://via.placeholder.com/300x200", // Will store Atlas GridFS link or AWS S3 URL
    },
    portfolio: [
      {
        title: { type: String },
        imageUrl: { type: String }, // Links to work samples
      },
    ],
    category: {
      type: String,
      enum: ["ID Cards", "Stationery", "Uniforms", "Books", "Multiple"],
      default: "ID Cards",
    },

    // --- CONTACT & LOGISTICS ---
    contactNumber: { 
        type: String, 
        required: [true, "Contact number is required"],
        trim: true 
    },
    address: { 
        type: String, 
        required: [true, "Shop address is required"],
        trim: true 
    },
    location: {
      lat: { type: Number },
      lng: { type: Number }, // For geolocation-based searching
    },

    // --- PRICING & SERVICES (Rate List) ---
    rateList: [
      {
        serviceName: { type: String, required: true },
        standardPrice: { type: Number, required: true },
        bulkPrice: { type: Number },
        unit: { type: String, default: "pc" },
      },
    ],

    // --- REPUTATION & ANALYTICS ---
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    totalJobsCompleted: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // --- SYSTEM CONTROLS ---
    isVerified: {
      type: Boolean,
      default: false, // Controlled by SuperAdmin
    },
    isOnline: {
      type: Boolean,
      default: true, // Controlled by Vendor
    },
    isActive: {
      type: Boolean,
      default: true, // Account "Kill Switch" for SuperAdmin
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * PASSWORD HASHING MIDDLEWARE
 * Hashes the password before saving it to Atlas
 */
ShopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * INSTANCE METHOD: MATCH PASSWORD
 * Used during Login API
 */
ShopSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: Dynamic count of services listed by the vendor
ShopSchema.virtual("serviceCount").get(function () {
  return this.rateList ? this.rateList.length : 0;
});

module.exports = mongoose.model("Shop", ShopSchema);