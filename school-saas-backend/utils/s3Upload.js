// utils/s3Upload.js
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");
const path = require("path");

/**
 * Connection resolution logic
 */
const dbPromise = new Promise((resolve, reject) => {
  if (mongoose.connection.readyState === 1) {
    resolve(mongoose.connection.db);
  } else {
    mongoose.connection.once("open", () => {
      resolve(mongoose.connection.db);
    });
  }
});

const storage = new GridFsStorage({
  db: dbPromise,
  file: (req, file) => {
    // Generate unique name
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `upload-${Date.now()}${ext}`;

    return {
      filename,
      bucketName: "uploads", // Collection name in Atlas
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPG, PNG and PDF are allowed."),
        false,
      );
    }
  },
});

// Middleware to check DB readiness
const waitForDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res
      .status(503)
      .json({ message: "Cloud storage initializing. Please wait." });
  }
  next();
};

// Exporting as an object (Named Exports)
module.exports = { upload, waitForDb };
