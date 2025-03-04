const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authMiddleware } = require('./auth'); 

// Middleware kiểm tra quyền Admin
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

/**
 * Route chỉ cho phép admin truy cập.
 * @route GET /admin
 * @access Private (Admin)
 * @returns {Object} message - Welcome Admin
 */
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

/**
 * Lấy danh sách tất cả người dùng.
 * @route GET /admin/users
 * @access Private (Admin)
 * @returns {Object[]} users - Danh sách tất cả người dùng
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Validate dữ liệu sản phẩm.
 * @param {Object} data - Dữ liệu sản phẩm.
 * @param {string} data.name - Tên sản phẩm.
 * @param {string} data.sku - SKU của sản phẩm.
 * @param {number} data.price - Giá sản phẩm.
 * @param {number} data.qty - Số lượng sản phẩm.
 * @param {string} [data.thumbnail] - URL ảnh thumbnail của sản phẩm.
 * @param {string[]} [data.images] - Danh sách URL ảnh của sản phẩm.
 * @returns {Object} Kết quả kiểm tra.
 * @returns {boolean} isValid - Dữ liệu hợp lệ hay không.
 * @returns {string[]} errors - Danh sách lỗi.
 */
const validateProduct = (data) => {
    const errors = [];
    if (!data.name) errors.push('Product name is required');
    if (!data.sku) errors.push('SKU is required');
    if (!data.price || data.price <= 0) errors.push('Valid price is required');
    if (typeof data.qty !== 'number' || data.qty < 0) errors.push('Valid quantity is required');
    return { isValid: errors.length === 0, errors };
};

/**
 * Lấy danh sách người dùng có phân trang.
 * @route GET /admin/users/paginated
 * @access Private (Admin)
 * @param {number} req.query.page - Trang hiện tại.
 * @param {number} req.query.limit - Số người dùng mỗi trang.
 * @returns {Object} Kết quả phân trang.
 * @returns {number} page - Trang hiện tại.
 * @returns {number} limit - Số lượng người dùng mỗi trang.
 * @returns {number} totalUsers - Tổng số người dùng.
 * @returns {number} totalPages - Tổng số trang.
 * @returns {Object[]} users - Danh sách người dùng.
 */
router.get('/users/paginated', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments();
        const users = await User.find().select('-password').skip(skip).limit(limit);

        res.json({ page, limit, totalUsers, totalPages: Math.ceil(totalUsers / limit), users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Tạo sản phẩm mới.
 * @route POST /admin/products
 * @access Private (Admin)
 * @param {Object} req.body - Dữ liệu sản phẩm.
 * @returns {Object} Sản phẩm đã tạo.
 */
router.post('/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validation = validateProduct(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Invalid product data', errors: validation.errors });
        }

        const existingProduct = await Product.findOne({ sku: req.body.sku });
        if (existingProduct) {
            return res.status(400).json({ message: 'SKU already exists' });
        }

        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Cập nhật sản phẩm.
 * @route PUT /admin/products/:id
 * @access Private (Admin)
 * @param {Object} req.body - Dữ liệu sản phẩm cần cập nhật.
 * @returns {Object} Sản phẩm đã cập nhật.
 */
router.put('/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validation = validateProduct(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Invalid product data', errors: validation.errors });
        }

        const existingProduct = await Product.findOne({ sku: req.body.sku, _id: { $ne: req.params.id } });
        if (existingProduct) {
            return res.status(400).json({ message: 'SKU already exists' });
        }

        const product = await Product.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Xóa sản phẩm.
 * @route DELETE /admin/products/:id
 * @access Private (Admin)
 * @returns {Object} Message xác nhận xóa sản phẩm.
 */
router.delete('/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
