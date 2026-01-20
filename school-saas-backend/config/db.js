const mongoose = require("mongoose");

/**
 * Mongoose 7+ requires strictQuery to be set.
 * Setting to false prepares for the change in default behavior.
 */
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
