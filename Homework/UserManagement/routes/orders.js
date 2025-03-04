const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
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

// Create order from cart
router.post('/', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const order = new Order({
            user: req.user.userId,
            items: cart.items,
            subtotal: cart.subtotal,
            tax: cart.tax,
            shipping: cart.shipping,
            total: cart.total,
            shippingAddress: req.body.shippingAddress
        });

        await order.save();
        
        // Clear cart
        cart.items = [];
        cart.subtotal = 0;
        cart.tax = 0;
        cart.shipping = 0;
        cart.total = 0;
        await cart.save();

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
                                .populate('items.product');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (admin only)
router.patch('/:id/status', authMiddleware, checkRole(['admin']), async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
