const express = require('express');
const router = express.Router();
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require('crypto');

// Định nghĩa authMiddleware trước
const authMiddleware = async (req, res, next) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
          return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
          return res.status(401).json({ message: "User not found" });
      }

      req.user = decoded;
      next();
  } catch (error) {
      res.status(401).json({ message: "Invalid token" });
  }
};
// Middleware kiểm tra role
const checkRole = (roles) => {
  return (req, res, next) => {
      const userRole = req.user.role;
      
      if (!roles.includes(userRole)) {
          return res.status(403).json({ 
              message: 'Access denied. Insufficient permissions.' 
          });
      }
      next();
  };
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
  },
});

// Utility Functions
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const verifyPassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
      throw new Error('Password and hashed password are required');
  }
  return await bcrypt.compare(password, hashedPassword);
};


// POST /auth/sign-in
router.post('/sign-in', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra user tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Kiểm tra email đã xác thực
        if (!user.isVerified) {
            return res.status(400).json({ message: "Please verify your email first" });
        }

        // So sánh mật khẩu
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Lưu token vào DB
        user.authToken = token;
        await user.save();

        // Trả về thông tin cần thiết
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /auth/sign-up
// POST /auth/sign-up
router.post('/sign-up', async (req, res) => {
  try {
      const { username, email, password, role } = req.body;

      // Validate input
      if (!username || !email || !password) {
          return res.status(400).json({ message: "All fields are required" });
      }

      // Validate role
      if (role && !['user', 'admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
      }

      // Check existing user
      const existingUser = await User.findOne({ 
          $or: [{ email }, { username }] 
      });
      if (existingUser) {
          return res.status(400).json({ 
              message: "Email or username already exists" 
          });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = generateToken();

      // Create new user
      const user = new User({
          username,
          email,
          password: hashedPassword,
          role: role || 'user', // Default to 'user' if role not specified
          verificationToken
      });

      await user.save();

      // Send verification email
      const verificationUrl = `${process.env.BASE_URL}/auth/verify-email/${email}/${verificationToken}`;
      
      await transporter.sendMail({
          to: email,
          subject: "Verify Your Email",
          html: `Click <a href="${verificationUrl}">here</a> to verify your email`
      });

      res.status(201).json({
          message: "Registration successful. Please check your email to verify your account."
      });

  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


// GET /auth/verify-email/:email/:token
router.get('/verify-email/:email/:token', async (req, res) => {
    try {
        const { email, token } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid verification link" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        if (user.verificationToken !== token) {
            return res.status(400).json({ message: "Invalid verification token" });
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.json({ message: "Email verified successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /auth/reset-password
router.put('/reset-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords don't match" });
        }

        const user = await User.findById(req.user.userId);
        
        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot password routes
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = generateToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;
        
        await transporter.sendMail({
            to: email,
            subject: "Password Reset",
            html: `Click <a href="${resetUrl}">here</a> to reset your password`
        });

        res.json({ message: "Password reset email sent" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = {
  router,
  authMiddleware
};