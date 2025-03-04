const express = require("express");
const bcrypt = require("bcryptjs"); // Mã hóa mật khẩu
const { check, validationResult } = require("express-validator"); // Middleware kiểm tra đầu vào
const User = require("../models/User"); // Import model User

const router = express.Router(); // Khởi tạo router Express

// 📌 Route: Đăng ký User
router.post(
    "/register",
    [
        check("username").isLength({ min: 3 }).withMessage("Ten nguoi dung phai tren 3 ky tu"),
        check("email").isEmail().withMessage("Can co email hop le"), // Kiểm tra email hợp lệ
        check("password").isLength({ min: 6 }).withMessage("Mat khau phai tren 6 ky tu"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, password, email } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email da duoc su dung" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        // Trả về thông báo thành công, không cần token
        res.status(201).json({ message: "Nguoi dung tao thanh cong!" });
    }
);

// 📌 Route: Đăng nhập User
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: "Thong tin xac thuc khong hop le" });
    }

    // Trả về user ID làm token
    res.json({ token: user._id });
});

module.exports = router;
