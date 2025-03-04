const User = require("../models/Users"); // Import model User để tương tác với database
const bcrypt = require("bcryptjs"); // Thư viện mã hóa mật khẩu
const jwt = require("jsonwebtoken"); // Thư viện tạo token JWT
const nodemailer = require("nodemailer"); // Thư viện gửi email

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail", // Sử dụng Gmail để gửi email
  auth: {
    user: process.env.EMAIL_USER, // Lấy email từ biến môi trường
    pass: process.env.EMAIL_PASS, // Lấy mật khẩu từ biến môi trường
  },
});

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Mã hóa mật khẩu trước khi lưu vào database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới (isVerified mặc định là false)
    const user = new User({ username, email, password: hashedPassword, role, isVerified: false });
    await user.save();

    // Tạo token để xác thực email (có hạn sử dụng 1 giờ)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Link xác thực email
    const url = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    // Gửi email xác thực
    await transporter.sendMail({
      to: email,
      subject: "Verify Email",
      html: `Click <a href="${url}">here</a> to verify your email.`,
    });

    res
      .status(201)
      .json({
        message:
          "User registered successfully. Please check your email to verify your account.",
      });
  } catch (err) {
    next(err);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Kiểm tra mật khẩu có đúng không
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Tạo token đăng nhập có thời hạn 1 giờ
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user theo ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Đánh dấu tài khoản đã xác thực
    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    // Tạo token reset mật khẩu
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Link cập nhật mật khẩu
    const url = `http://localhost:3000/api/auth/update-password?token=${token}`;

    // Gửi email cho user
    await transporter.sendMail({
      to: email,
      subject: "Reset Password",
      html: `Click <a href="${url}">here</a> to reset your password.`,
    });

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user theo ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resetPassword,
  updatePassword,
};
