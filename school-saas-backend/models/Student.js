const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const StudentSchema = new mongoose.Schema(
  {
    // --- BASIC IDENTITY ---
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    // Adding email to the schema because Auth Controller checks/saves it
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please fill a valid email address"],
    },
    rollNo: {
      type: String,
      required: [true, "Roll number is required"],
    },
    class: {
      type: String,
      required: [true, "Class/Section is required"], // e.g., "10-A"
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    // --- PARENT/GUARDIAN DETAILS ---
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    // Changed required to false here so registration doesn't crash
    // It can be filled later by the student/admin
    emergencyContact: {
      type: String,
      trim: true,
    },

    // --- DIGITAL ID CARD DATA ---
    photo: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    bloodGroup: {
      type: String,
      uppercase: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", ""],
      default: "",
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Pending Verification", "Verified"],
      default: "Draft",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    // --- ACADEMICS & LMS ---
    admitCardUrl: { type: String, default: "" },
    results: [
      {
        examName: String,
        marksheetUrl: String,
        percentage: String,
        grade: String,
        publishedAt: Date,
      },
    ],
    enrolledCourses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        progress: { type: Number, default: 0 },
      },
    ],

    // --- RELATIONS & CONTROL ---
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "schoolId is required to link student to a school"],
    },
    role: {
      type: String,
      default: "student",
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- MIDDLEWARE & METHODS ---

/**
 * PASSWORD HASHING
 */
StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * PASSWORD COMPARISON
 */
StudentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- PERFORMANCE INDEXING ---
StudentSchema.index({ schoolId: 1, rollNo: 1 }, { unique: true });
StudentSchema.index({ username: 1 });

module.exports = mongoose.model("Student", StudentSchema);
