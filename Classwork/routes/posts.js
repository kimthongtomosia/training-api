const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');

// Get all posts
router.get('/', async (req, res) => {
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

// Get a single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




const validatePost = [
  check('author').notEmpty().withMessage(''),
  check('title').notEmpty().withMessage('tac gia bat buoc')
      .isLength({ min: 3, max: 100 }).withMessage('tiêu đề phải từ 3 đến 100 ký tự'),
  check('content').notEmpty().withMessage('noi dung bat buoc')
      .isLength({ min: 10 }).withMessage('noi dung dai it nhat 10 dong'),
  check('status').optional().isIn(['draft', 'published']).withMessage('trang thai phai la draft hoac published'),
];

// Create a new post
router.post('/', validatePost, async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }
      // const user = await User.findById(req.body.author);
      // if (!user) {
      //     return res.status(404).json({ message: 'User not found' });
      // }

      const post = new Post({
          author: req.body.author,
          title: req.body.title,
          content: req.body.content,
          status: req.body.status || 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
      });

      const newPost = await post.save();
      res.status(201).json(newPost);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});

// Update a post


router.put('/:id', async (req, res) => {
       try {
        const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }

});

// Delete a post


router.delete('/:id', async (req, res) => {
          try {
            const post = await Post.findById(req.params.id);
            if (!post) {
              return res.status(404).json({ message: 'Post not found' });
            }

            await post.deleteOne();
            res.json({ message: 'Post deleted' });
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

        if (req.query.month) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - parseInt(req.query.month));
            query.createdAt = { $gte: startDate };
        }

        const posts = await Post.find(query).populate('author');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
 

module.exports = router;