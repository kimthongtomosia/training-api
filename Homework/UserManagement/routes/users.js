const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('./auth');
const { body, validationResult } = require('express-validator');


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

// Validation rules
const userValidation = [
    body('username')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address'),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

/**
 * GET /users/profile
 * Lấy thông tin profile người dùng
 */
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Lấy thông tin user từ authMiddleware
        const user = req.user;

        // Mapping dữ liệu trả về (loại bỏ password và các field nhạy cảm)
        const userProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        };

        res.json(userProfile);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * PUT /users/profile
 * Cập nhật thông tin profile người dùng
 */
router.put('/profile', 
    authMiddleware, 
    userValidation,
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email } = req.body;
            const userId = req.user._id;

            // Kiểm tra username/email đã tồn tại
            if (username || email) {
                const existingUser = await User.findOne({
                    _id: { $ne: userId },
                    $or: [
                        { username: username },
                        { email: email }
                    ]
                });

                if (existingUser) {
                    return res.status(400).json({
                        message: 'Username or email already in use'
                    });
                }
            }

            // Cập nhật thông tin
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: req.body },
                { new: true, select: '-password' }
            );

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

module.exports = router;

