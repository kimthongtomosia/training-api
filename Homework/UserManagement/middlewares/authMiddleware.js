// Import thư viện jsonwebtoken (JWT) để xử lý xác thực người dùng
const jwt = require('jsonwebtoken');

// Middleware xác thực người dùng (Auth Middleware)
const authMiddleware = (req, res, next) => {
    // Lấy token từ header Authorization (định dạng: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Nếu không có token, trả về lỗi 401 (Unauthorized)
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        // Giải mã (verify) token bằng JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lưu thông tin user từ token vào request để sử dụng ở các middleware/controller tiếp theo
        req.user = decoded;
        
        // Gọi next() để tiếp tục xử lý request
        next();
    } catch (err) {
        // Nếu token không hợp lệ, trả về lỗi 400 (Bad Request)
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Middleware kiểm tra quyền Admin (Admin Middleware)
const adminMiddleware = (req, res, next) => {
    // Kiểm tra nếu user không có quyền admin thì trả về lỗi 403 (Forbidden)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Nếu là admin, cho phép tiếp tục request
    next();
};

// Xuất các middleware để sử dụng trong các file khác
module.exports = { authMiddleware, adminMiddleware };
