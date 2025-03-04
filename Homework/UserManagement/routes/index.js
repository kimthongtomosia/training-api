const express = require('express');
const router = express.Router();
const { router: authRouter, authMiddleware } = require('./auth');
const userRouter = require('./users');
const adminRouter = require('./admin');

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);

module.exports = router;
