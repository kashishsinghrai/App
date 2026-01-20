const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "school", "shop", "student", "user"],
      required: true,
    },

    // Relation IDs: Links the user to their specific profile data
    schoolProfile: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    shopProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

    isActive: { type: Boolean, default: true }, // Super Admin can toggle this
    isVerified: { type: Boolean, default: false }, // For Marketplace approval
  },
  { timestamps: true }
);

// Password Hashing Middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

// Compare Password Method
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
