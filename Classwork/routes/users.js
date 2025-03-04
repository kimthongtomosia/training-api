const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');

// Get all users
router.get('/', async (req, res) => {
         try {
                  // const query = { email: { $regex: req.params.email, $options: 'i' } };

             const query = {};
     
             if (req.query.email) {
                 query.email = { $regex: req.query.email, $options: 'i' };
             }
     
             const users = await User.find(query);
             res.json(users);
         } catch (err) {
             res.status(500).json({ message: err.message });
         }
     });
        
     
// Create user
router.post('/', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Tìm kiếm bài post theo tên tác giả và trạng thái.

router.get('/search', async (req, res) => {
    try {
        const query = {};

        if (req.query.author) {
            query.author = req.query.author;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        const posts = await Post.find(query).populate('author');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lấy tất cả bài post của một user cụ thể.

router.get('/:id/posts', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ author: user._id }).populate('author');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Lấy tất cả bài post của một user cụ thể đã tạo trong tháng hiện tại.

router.get('/:id/posts/month', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } 
        const currentMonth = new Date().getMonth() + 1;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - currentMonth);
        const posts = await Post.find({ author: user._id, createdAt: { $gte: startDate } }).populate('author');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Đếm số lượng bài post của một user cụ thể.

router.get('/:id/posts/count', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const count = await Post.countDocuments({ author: user._id });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;