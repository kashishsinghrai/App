const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SchoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    logo: { type: String, default: "" }, // AWS S3 or GridFS link
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },

    // --- Marketplace ---
    assignedShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },

    // --- System Control ---
    role: { type: String, default: "school", immutable: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // --- ID Card Template Settings ---
    idCardTemplate: {
      backgroundImage: String,
      config: {
        photo: { x: Number, y: Number },
        name: { x: Number, y: Number },
        qrCode: { x: Number, y: Number },
      },
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
SchoolSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
SchoolSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("School", SchoolSchema);
