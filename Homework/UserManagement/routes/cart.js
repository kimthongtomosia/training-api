const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('./auth');


// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId })
                            .populate('items.product');
        if (!cart) {
            cart = new Cart({ user: req.user.userId });
            await cart.save();
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add item to cart
router.post('/items', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId });
        }

        // Check if product already in cart
        const itemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }

        // Update totals
        cart.subtotal = cart.items.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );
        cart.tax = cart.subtotal * 0.1; // 10% tax
        cart.shipping = cart.subtotal > 100 ? 0 : 10; // Free shipping over $100
        cart.total = cart.subtotal + cart.tax + cart.shipping;

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
