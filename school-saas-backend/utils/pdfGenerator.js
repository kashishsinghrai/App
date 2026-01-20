const PDFDocument = require("pdfkit");
const axios = require("axios");
const QRCode = require("qrcode");
const mongoose = require("mongoose");

/**
 * HELPER: Fetch from External Link (Design Frames/Logos)
 */
async function fetchImageBuffer(url) {
  try {
    // If URL is local/relative, prepend the server base (Change for production)
    const fullUrl = url.startsWith("http")
      ? url
      : `http://localhost:5000${url}`;
    const response = await axios.get(fullUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "utf-8");
  } catch (error) {
    console.error("External Image Fetch Error:", error.message);
    return null;
  }
}

/**
 * HELPER: Fetch from MongoDB GridFS (Student Portraits)
 */
async function fetchFromGridFS(bucket, filename) {
  return new Promise((resolve) => {
    const chunks = [];
    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.on("data", (chunk) => chunks.push(chunk));
    downloadStream.on("error", () => resolve(null));
    downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * 1. BULK ID CARD GENERATOR (For Vendors)
 * Layout: 10 Cards per A4 Sheet (2x5 Grid)
 */
exports.generateCustomIDCards = async (students, school, res) => {
  const CARD_WIDTH = 250;
  const CARD_HEIGHT = 150; // Horizontal style
  const MARGIN_X = 40;
  const MARGIN_Y = 50;
  const GAP = 20;

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  doc.pipe(res);

  let currentX = MARGIN_X;
  let currentY = MARGIN_Y;
  let cardCount = 0;

  const gridbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  for (const student of students) {
    const design = school.idCardTemplate;

    // Handle Page Breaks (10 cards per page)
    if (cardCount > 0 && cardCount % 10 === 0) {
      doc.addPage();
      currentX = MARGIN_X;
      currentY = MARGIN_Y;
    } else if (cardCount > 0 && cardCount % 2 === 0) {
      currentX = MARGIN_X;
      currentY += CARD_HEIGHT + GAP;
    } else if (cardCount > 0) {
      currentX += CARD_WIDTH + GAP;
    }

    // Layer 1: Background
    if (design?.backgroundImage) {
      const bg = await fetchImageBuffer(design.backgroundImage);
      if (bg)
        doc.image(bg, currentX, currentY, {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        });
    } else {
      doc.rect(currentX, currentY, CARD_WIDTH, CARD_HEIGHT).stroke("#e2e8f0");
    }

    // Layer 2: Student Photo (GridFS)
    if (student.photo) {
      const filename = student.photo.split("/").pop();
      const photoBuf = await fetchFromGridFS(gridbucket, filename);
      if (photoBuf) {
        const pX = design?.config?.photo?.x
          ? design.config.photo.x * CARD_WIDTH
          : 10;
        const pY = design?.config?.photo?.y
          ? design.config.photo.y * CARD_HEIGHT
          : 10;
        doc.image(photoBuf, currentX + pX, currentY + pY, {
          width: 50,
          height: 60,
        });
      }
    }

    // Layer 3: Text Data
    const nX = design?.config?.name?.x ? design.config.name.x * CARD_WIDTH : 70;
    const nY = design?.config?.name?.y
      ? design.config.name.y * CARD_HEIGHT
      : 20;
    doc
      .fillColor("#000")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(student.name.toUpperCase(), currentX + nX, currentY + nY);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(`Roll: ${student.rollNo}`, currentX + nX, currentY + nY + 12);

    cardCount++;
  }
  doc.end();
};

/**
 * 2. ADMIT CARD GENERATOR (For Students)
 * Layout: Single A4 Official Document
 */
exports.generateAdmitCardPDF = async (student, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const gridbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  // Header: School Info
  doc
    .fillColor("#1e40af")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(student.schoolId.name.toUpperCase(), { align: "center" });
  doc
    .fillColor("#64748b")
    .fontSize(10)
    .text(student.schoolId.address, { align: "center" });
  doc
    .moveDown()
    .strokeColor("#cbd5e1")
    .moveTo(50, 110)
    .lineTo(545, 110)
    .stroke();

  // Student Section
  doc
    .moveDown(2)
    .fillColor("#1e293b")
    .fontSize(16)
    .text("EXAMINATION ADMIT CARD", { align: "center", underline: true });

  if (student.photo) {
    const filename = student.photo.split("/").pop();
    const photoBuf = await fetchFromGridFS(gridbucket, filename);
    if (photoBuf) doc.image(photoBuf, 440, 140, { width: 100, height: 120 });
  }

  doc
    .fontSize(12)
    .fillColor("#475569")
    .text(`Name: `, 50, 150, { continued: true })
    .fillColor("#000")
    .text(student.name);
  doc
    .fillColor("#475569")
    .text(`Roll No: `, 50, 175, { continued: true })
    .fillColor("#000")
    .text(student.rollNo);
  doc
    .fillColor("#475569")
    .text(`Class: `, 50, 200, { continued: true })
    .fillColor("#000")
    .text(student.class);

  // Footer: Instructions & Signature
  doc
    .fontSize(10)
    .fillColor("#ef4444")
    .text("Important:", 50, 650)
    .fillColor("#64748b")
    .text("Please carry a printed copy and your school ID to the exam center.");
  doc
    .fontSize(10)
    .text("Controller of Examinations", 400, 750, { align: "right" });

  doc.end();
};

/**
 * 3. MARKSHEET / RESULT GENERATOR
 * Layout: Formal Academic Table
 */
exports.generateResultPDF = async (student, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("PROGRESS REPORT", { align: "center" });
  doc.moveDown().fontSize(12).text(`Student Name: ${student.name}`);
  doc.text(`Roll Number: ${student.rollNo}`);
  doc.moveDown();

  // Table Logic
  doc.rect(50, 200, 500, 20).fill("#f1f5f9");
  doc
    .fillColor("#475569")
    .text("Subject", 60, 205)
    .text("Marks", 300, 205)
    .text("Grade", 450, 205);

  // You can loop through real result data here
  let y = 230;
  student.results?.forEach((res) => {
    doc
      .fillColor("#000")
      .text(res.subject, 60, y)
      .text(res.marks, 300, y)
      .text(res.grade, 450, y);
    y += 25;
  });

  doc.end();
};
