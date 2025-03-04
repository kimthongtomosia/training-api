// Import thư viện mongoose để làm việc với MongoDB
const mongoose = require('mongoose');

// Định nghĩa schema cho user (Cấu trúc của document trong collection "users")
const userSchema = new mongoose.Schema({
    // Thuộc tính username (tên người dùng)
    username: {
        type: String,      // Kiểu dữ liệu là chuỗi
        required: true,    // Bắt buộc phải có
        unique: true       // Không được trùng lặp với user khác
    },
    
    // Thuộc tính email
    email: {
        type: String,      // Kiểu dữ liệu là chuỗi
        required: true,    // Bắt buộc phải có
        unique: true       // Không được trùng lặp
    },

    // Thuộc tính password (mật khẩu)
    password: {
        type: String,      // Kiểu dữ liệu là chuỗi
        required: true     // Bắt buộc phải có
    },

    // Thuộc tính role (vai trò của user)
    role: {
        type: String,      // Kiểu dữ liệu là chuỗi
        enum: ['user', 'admin'],  // Chỉ nhận giá trị 'user' hoặc 'admin'
        default: 'user'    // Mặc định là 'user'
    },

    // Thuộc tính xác thực email (đã xác thực hay chưa)
    isVerified: {
        type: Boolean,     // Kiểu dữ liệu boolean (true/false)
        default: false     // Mặc định là false (chưa xác thực)
    }
});

// Xuất model User để sử dụng ở các file khác
module.exports = mongoose.model('User', userSchema);
