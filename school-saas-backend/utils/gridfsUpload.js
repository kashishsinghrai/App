// utils/s3Upload.js  (ya gridfsUpload.js)
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");

// Tera connection already server.js / db.js mein open ho raha hai
// toh hum mongoose.connection.db use karenge

const storage = new GridFsStorage({
  db: mongoose.connection.db, // ← yeh important, existing connection use karega
  bucketName: "uploads", // tera server.js mein same bucketName hai
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname.replace(
        /\s+/g,
        "-"
      )}`;
      const fileInfo = {
        filename: filename,
        bucketName: "uploads",
      };
      resolve(fileInfo);
    });
  },
});

// Optional: agar connection ready nahi hai toh promise return kar sakte hain
// lekin mongoose.connection.db already available hoga jab route hit hoga (protect middleware ke baad)

const upload = multer({ storage });

module.exports = upload;
