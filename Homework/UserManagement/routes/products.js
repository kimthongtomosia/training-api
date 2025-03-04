const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authMiddleware } = require('./auth');


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
     

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new product (admin only)
router.post('/', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const product = new Product(req.body);
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update product (admin only)
router.put('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
