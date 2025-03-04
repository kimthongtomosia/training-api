const express = require('express');
const { register, login, verifyEmail, resetPassword, updatePassword } = require('../controllers/authController');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const User = require('../models/Users');


// Route đăng ký tài khoản (POST /api/auth/register)
router.post('/register', register);

// Route đăng nhập (POST /api/auth/login)
router.post('/login', login);

// Route xác thực email (GET /api/auth/verify-email?token=...)
router.get('/verify-email', verifyEmail);

// Route dang xuat
router.put("/logout", authMiddleware, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1]; // Lấy token từ header
  
      if (!token) {
        return res.status(400).json({ message: "No token provided" });
      }
  
      // Tìm user có token này trong DB
      const user = await User.findOne({ token });
  
      if (!user) {
        return res.status(404).json({ message: "User not found or already logged out" });
      }
  
      // Xóa token khỏi DB
      user.token = null;
      await user.save();
  
      res.json({ message: "Logout successful!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  

// Route lấy thông tin user từ token
router.get('/user-detail', authMiddleware, (req, res) => {
    try {
        // Lấy userId từ token đã giải mã trong middleware
        const userId = req.user.id;

        // Tìm user dựa trên userId
        User.findById(userId)
            .then(user => {
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                res.json(user); // Trả về thông tin user
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ message: 'Server error' });
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Route gửi email đặt lại mật khẩu (POST /api/auth/reset-password)
router.post('/reset-password', resetPassword);

// Route cập nhật mật khẩu sau khi đặt lại (POST /api/auth/update-password)
router.post('/update-password', updatePassword);

// Route chỉ cho phép admin truy cập (GET /api/auth/admin)
// Sử dụng authMiddleware để kiểm tra đăng nhập trước
// Sử dụng adminMiddleware để kiểm tra quyền admin
router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

// admin lay tat ca users
router.get('/admin/users', authMiddleware, adminMiddleware, (req, res) => {
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

//admin lay user theo id 
router.get('/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    const userId = req.params.id;
    User.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
});

// admin them user moi
router.post('/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    const { username, email, password } = req.body;
    User.create({ username, email, password })
        .then(user => {
            res.status(201).json(user);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
});
// admin xoa user 
router.delete('/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    const userId = req.params.id;
    User.findByIdAndDelete(userId)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
})
// admin cap nhat user theo id
router.put('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password, role, isVerified } = req.body;

        // Kiểm tra xem user có tồn tại không
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Chỉ cập nhật những trường có giá trị hợp lệ
        const updatedData = {};
        if (username) updatedData.username = username;
        if (email) updatedData.email = email;
        if (password) updatedData.password = password;
        if (role) updatedData.role = role;
        if (typeof isVerified === 'boolean') updatedData.isVerified = isVerified;

        // Cập nhật user
        user = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });

        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// admin xoa user theo id
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
    const userId = req.params.id;
    User.findByIdAndDelete(userId)
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
})
// Xuất router để sử dụng trong file `server.js` hoặc `app.js`
module.exports = router;
