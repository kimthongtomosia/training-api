const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();


const authMiddleware = (req, res, next) => {
    // Lấy token từ header Authorization (định dạng: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Nếu không có token, trả về lỗi 401 (Unauthorized)
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        // Giải mã (verify) token bằng JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lưu thông tin user từ token vào request để sử dụng ở các middleware/controller tiếp theo
        req.user = decoded;
        
        // Gọi next() để tiếp tục xử lý request
        next();
    } catch (err) {
        // Nếu token không hợp lệ, trả về lỗi 400 (Bad Request)
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Middleware kiểm tra quyền Admin (Admin Middleware)
const adminMiddleware = (req, res, next) => {
    // Kiểm tra nếu user không có quyền admin thì trả về lỗi 403 (Forbidden)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Nếu là admin, cho phép tiếp tục request
    next();
};

// Route chỉ cho phép admin truy cập (GET /api/admin)
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

// admin lay tat ca users
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
    try {
        User.find()
            .then(users => {
                res.json(users);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Server error' });
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
    // res.json({ message: 'Welcome Admin' });
    // // Get all users from database
    // // res.json(users);
    // // Example: res.json([
    // //     { id: 1, username: 'user1', email: 'user1@example.com' },
    // //     { id: 2, username: 'user2', email: 'user2@example.com' },
    // // ]);
    // // Example: res.json([]);
    // // Example: res.json(null); // Trả về null
    // // Example: res.status(404).json({ message: 'Not found' });

});

module.exports = router;
