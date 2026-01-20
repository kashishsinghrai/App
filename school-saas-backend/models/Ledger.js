const mongoose = require("mongoose");

const LedgerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: { type: String, required: true },
    phone: { type: String },
    work: { type: String, required: true },
    amount: { type: Number, required: true },
    paid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Partial"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ledger", LedgerSchema);
