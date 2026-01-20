const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (School, Shop, Student, or Admin)
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post("/login", login);

module.exports = router;
