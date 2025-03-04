const express = require('express');
const router = express.Router();
const { router: authRouter, authMiddleware } = require('./auth');
const userRouter = require('./users');
const adminRouter = require('./admin');
const productRoutes = require('./products');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
