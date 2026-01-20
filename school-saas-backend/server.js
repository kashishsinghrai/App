const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Routes import
const authRoutes = require("./routes/authRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const shopRoutes = require("./routes/shopRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes"); // ← Added

/**
 * 1. DOTENV CONFIGURATION
 */
dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * 2. DATABASE CONNECTION
 */
connectDB();

const app = express();

/**
 * 3. GRIDFS INITIALIZATION (MongoDB Atlas Storage)
 */
let gridbucket;
mongoose.connection
  .once("open", () => {
    gridbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
    console.log("📦 GridFS Bucket Initialized – Ready for file streaming");
  })
  .on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

/**
 * 4. CORE MIDDLEWARES
 */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  helmet({
    crossOriginResourcePolicy: false, // Required for mobile apps to load images
  })
);

app.use(
  cors({
    origin: "*", // Change to your frontend URL in production (e.g. http://localhost:19006)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/**
 * 5. STATIC & FILE STREAMING ROUTES
 */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Stream files from GridFS (used in mobile: http://your-server/api/files/view/filename.jpg)
app.get("/api/files/view/:filename", async (req, res) => {
  try {
    if (!gridbucket) {
      return res
        .status(503)
        .json({ message: "Storage service not ready yet." });
    }

    const files = await gridbucket
      .find({ filename: req.params.filename })
      .toArray();
    if (!files.length) {
      return res.status(404).json({ message: "File not found" });
    }

    res.set("Content-Type", files[0].contentType || "application/octet-stream");
    const readstream = gridbucket.openDownloadStreamByName(req.params.filename);
    readstream.pipe(res);
  } catch (err) {
    console.error("File stream error:", err);
    res.status(500).json({ message: "Error streaming file" });
  }
});

/**
 * 6. ROUTE MOUNTING (All API routes)
 */
app.use("/api/auth", authRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", userRoutes);
app.use("/api/attendance", attendanceRoutes); // ← Added properly

/**
 * 7. HEALTH CHECK & Root Route
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Active",
    environment: process.env.NODE_ENV,
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    storage: "MongoDB Atlas (GridFS)",
    version: "1.3.0",
    message: "School SaaS Backend is running 🚀",
  });
});

/**
 * 8. 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

/**
 * 9. Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/**
 * 10. START SERVER
 */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 School SaaS Backend Started
  🔗 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV?.toUpperCase() || "development"}
  📡 API Base: http://localhost:${PORT}/api
  🖼️  File Streaming: http://localhost:${PORT}/api/files/view/[filename]
  📂 GridFS Bucket: uploads (MongoDB Atlas)
  `);
});

/**
 * 11. Graceful Shutdown
 */
process.on("SIGTERM", () => {
  console.log("SIGTERM received – Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
