// models/Template.js
const TemplateSchema = new mongoose.Schema({
  title: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "ownerModel", // This links to either School or Shop
  },
  ownerModel: {
    type: String,
    enum: ["School", "Shop"], // Defines who uploaded it
  },
  backgroundImage: String, // AWS S3 URL
  settings: {
    studentPhoto: { x: Number, y: Number, w: Number, h: Number },
    qrCode: { x: Number, y: Number, size: Number },
    studentName: { x: Number, y: Number, fontSize: Number, color: String },
    // school name/logo settings...
  },
  isPublic: { type: Boolean, default: false }, // If a Vendor wants to show this to all linked schools
});
